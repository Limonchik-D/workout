'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { db } from '@/lib/db/dexie';
import {
  calcPeriodStats,
  calcExerciseStats,
  calcExerciseChartData,
  calcCategoryDistribution,
  filterWorkoutsByPeriod,
} from '@/lib/calculations';
import type { StatPeriod, ChartMetric } from '@/types/domain';
import { CATEGORY_LABELS } from '@/types/domain';

export function useStatistics(period: StatPeriod) {
  const allWorkouts = useLiveQuery(
    () => db.workouts.where('status').equals('completed').toArray(),
    []
  );
  const allWorkoutExercises = useLiveQuery(() => db.workoutExercises.toArray(), []);
  const allSets = useLiveQuery(() => db.sets.toArray(), []);

  const filteredWorkouts = useMemo(() => {
    if (!allWorkouts) return [];
    return filterWorkoutsByPeriod(allWorkouts, period);
  }, [allWorkouts, period]);

  const periodStats = useMemo(() => {
    if (!allWorkoutExercises || !allSets) return null;
    return calcPeriodStats(filteredWorkouts, allSets, allWorkoutExercises);
  }, [filteredWorkouts, allWorkoutExercises, allSets]);

  const exerciseStatsList = useMemo(() => {
    if (!allWorkoutExercises || !allSets) return [];
    // Get unique exercises from filtered workouts
    const filteredWids = new Set(filteredWorkouts.map((w) => w.id));
    const filteredWEs = allWorkoutExercises.filter((we) => filteredWids.has(we.workoutId));
    const exerciseMap = new Map<string, { name: string; category: import('@/types/domain').ExerciseCategory }>();
    for (const we of filteredWEs) {
      if (!exerciseMap.has(we.exerciseId)) {
        exerciseMap.set(we.exerciseId, {
          name: we.exerciseNameSnapshot,
          category: we.exerciseCategorySnapshot,
        });
      }
    }
    return Array.from(exerciseMap.entries()).map(([id, { name, category }]) =>
      calcExerciseStats(id, name, category, allWorkoutExercises, allSets)
    );
  }, [filteredWorkouts, allWorkoutExercises, allSets]);

  const categoryDist = useMemo(() => {
    if (!allWorkoutExercises || !allSets) return null;
    const filteredWids = new Set(filteredWorkouts.map((w) => w.id));
    const filteredWEs = allWorkoutExercises.filter((we) => filteredWids.has(we.workoutId));
    return calcCategoryDistribution(filteredWEs, allSets);
  }, [filteredWorkouts, allWorkoutExercises, allSets]);

  const categoryChartData = useMemo(() => {
    if (!categoryDist) return [];
    return Object.entries(categoryDist)
      .filter(([, v]) => v > 0)
      .map(([key, value]) => ({
        name: CATEGORY_LABELS[key as keyof typeof CATEGORY_LABELS],
        value: Math.round(value),
        key,
      }));
  }, [categoryDist]);

  return {
    isLoading: !allWorkouts || !allWorkoutExercises || !allSets,
    periodStats,
    exerciseStatsList,
    categoryChartData,
    filteredWorkouts,
  };
}

export function useExerciseChartData(
  exerciseId: string,
  metric: ChartMetric,
  period: StatPeriod
) {
  const allWorkouts = useLiveQuery(
    () => db.workouts.where('status').equals('completed').toArray(),
    []
  );
  const allWorkoutExercises = useLiveQuery(() => db.workoutExercises.toArray(), []);
  const allSets = useLiveQuery(() => db.sets.toArray(), []);

  const data = useMemo(() => {
    if (!allWorkouts || !allWorkoutExercises || !allSets) return [];
    const filtered = filterWorkoutsByPeriod(allWorkouts, period);
    return calcExerciseChartData(exerciseId, metric, filtered, allWorkoutExercises, allSets);
  }, [exerciseId, metric, period, allWorkouts, allWorkoutExercises, allSets]);

  return data;
}
