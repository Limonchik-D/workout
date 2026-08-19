'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback } from 'react';
import {
  getDraftWorkout,
  createWorkout,
  finishWorkout,
  deleteWorkout,
  addExerciseToWorkout,
  removeExerciseFromWorkout,
  getWorkoutWithExercises,
  reorderWorkoutExercises,
} from '@/lib/db/repositories/workouts';
import { addSet, updateSet, deleteSet } from '@/lib/db/repositories/sets';
import { touchExerciseLastUsed } from '@/lib/db/repositories/exercises';
import type { Exercise } from '@/types/domain';

export function useWorkout() {
  // useLiveQuery uses `undefined` as "not yet loaded" sentinel.
  // getDraftWorkout() also returns `undefined` when no draft exists — indistinguishable.
  // Fix: map `undefined` result → `null` so the page can tell loading from "no draft".
  const draft = useLiveQuery<import('@/types/domain').Workout | null>(
    () => getDraftWorkout().then((d) => d ?? null),
    []
  );

  const workoutWithExercises = useLiveQuery(
    () =>
      draft?.id
        ? getWorkoutWithExercises(draft.id).then((d) => d ?? null)
        : Promise.resolve(null),
    [draft?.id]
  );

  const startWorkout = useCallback(async () => {
    const existing = await getDraftWorkout();
    if (existing) return existing;
    return createWorkout();
  }, []);

  const finishCurrentWorkout = useCallback(async () => {
    if (!draft) return;
    const startedAt = new Date(draft.startedAt);
    const durationSeconds = Math.floor((Date.now() - startedAt.getTime()) / 1000);
    await finishWorkout(draft.id, durationSeconds);
  }, [draft]);

  const discardDraft = useCallback(async () => {
    if (!draft) return;
    await deleteWorkout(draft.id);
  }, [draft]);

  const addExercise = useCallback(
    async (exercise: Exercise) => {
      if (!draft) return;
      await addExerciseToWorkout(
        draft.id,
        exercise.id,
        exercise.name,
        exercise.category
      );
      await touchExerciseLastUsed(exercise.id);
    },
    [draft]
  );

  const removeExercise = useCallback(async (workoutExerciseId: string) => {
    await removeExerciseFromWorkout(workoutExerciseId);
  }, []);

  const reorderExercises = useCallback(
    async (orderedIds: string[]) => {
      if (!draft) return;
      await reorderWorkoutExercises(draft.id, orderedIds);
    },
    [draft]
  );

  const addSetToExercise = useCallback(
    async (workoutExerciseId: string, weight: number, reps: number, setNumber: number) => {
      return addSet({ workoutExerciseId, weight, reps, setNumber });
    },
    []
  );

  const updateExerciseSet = useCallback(
    async (setId: string, data: { weight?: number; reps?: number }) => {
      return updateSet(setId, data);
    },
    []
  );

  const deleteExerciseSet = useCallback(async (setId: string) => {
    return deleteSet(setId);
  }, []);

  return {
    draft,
    workoutWithExercises,
    startWorkout,
    finishCurrentWorkout,
    discardDraft,
    addExercise,
    removeExercise,
    reorderExercises,
    addSetToExercise,
    updateExerciseSet,
    deleteExerciseSet,
  };
}
