import type {
  Workout,
  WorkoutExercise,
  WorkoutSet,
  ExerciseStats,
  PeriodStats,
  StatPeriod,
  ChartDataPoint,
  ChartMetric,
  ExerciseCategory,
} from '@/types/domain';

export function getPeriodStart(period: StatPeriod): Date | null {
  const now = new Date();
  switch (period) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '1m':
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    case '3m':
      return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    case '6m':
      return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    case '1y':
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    case 'all':
      return null;
  }
}

export function filterWorkoutsByPeriod(workouts: Workout[], period: StatPeriod): Workout[] {
  const start = getPeriodStart(period);
  if (!start) return workouts;
  return workouts.filter((w) => new Date(w.startedAt) >= start);
}

export function calcVolume(sets: WorkoutSet[]): number {
  return sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
}

export function calcPeriodStats(
  workouts: Workout[],
  allSets: WorkoutSet[],
  allWorkoutExercises: WorkoutExercise[]
): PeriodStats {
  const workoutIds = new Set(workouts.map((w) => w.id));
  const weIds = new Set(
    allWorkoutExercises.filter((we) => workoutIds.has(we.workoutId)).map((we) => we.id)
  );
  const relevantSets = allSets.filter((s) => weIds.has(s.workoutExerciseId));

  const totalVolume = calcVolume(relevantSets);
  const totalSets = relevantSets.length;
  const totalDuration = workouts.reduce((s, w) => s + (w.durationSeconds ?? 0), 0);

  // Calculate longest streak (consecutive days)
  const trainingDays = [
    ...new Set(workouts.map((w) => w.startedAt.slice(0, 10))),
  ].sort();

  let longest = 0;
  let current = 0;
  for (let i = 0; i < trainingDays.length; i++) {
    if (i === 0) {
      current = 1;
    } else {
      const prev = new Date(trainingDays[i - 1]);
      const cur = new Date(trainingDays[i]);
      const diff = (cur.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        current++;
      } else {
        current = 1;
      }
    }
    longest = Math.max(longest, current);
  }

  return {
    workoutCount: workouts.length,
    totalSets,
    totalVolume,
    totalDurationSeconds: totalDuration,
    longestStreak: longest,
  };
}

export function calcExerciseStats(
  exerciseId: string,
  exerciseName: string,
  exerciseCategory: ExerciseCategory,
  workoutExercises: WorkoutExercise[],
  sets: WorkoutSet[]
): ExerciseStats {
  const weIds = new Set(
    workoutExercises.filter((we) => we.exerciseId === exerciseId).map((we) => we.id)
  );
  const relevantSets = sets.filter((s) => weIds.has(s.workoutExerciseId));

  const maxWeight = relevantSets.reduce((m, s) => Math.max(m, s.weight), 0);
  const maxReps = relevantSets.reduce((m, s) => Math.max(m, s.reps), 0);
  const totalVolume = calcVolume(relevantSets);
  const sessionCount = weIds.size;

  const lastUsedAt = relevantSets
    .map((s) => s.completedAt ?? s.createdAt)
    .sort()
    .reverse()[0] ?? '';

  return {
    exerciseId,
    exerciseName,
    exerciseCategory,
    totalSets: relevantSets.length,
    totalVolume,
    maxWeight,
    maxReps,
    sessionCount,
    lastUsedAt,
  };
}

export function calcExerciseChartData(
  exerciseId: string,
  metric: ChartMetric,
  workouts: Workout[],
  workoutExercises: WorkoutExercise[],
  sets: WorkoutSet[]
): ChartDataPoint[] {
  // Group by workout date
  const byWorkout = new Map<string, { date: string; sets: WorkoutSet[] }>();

  for (const w of workouts) {
    const weForExercise = workoutExercises.filter(
      (we) => we.workoutId === w.id && we.exerciseId === exerciseId
    );
    for (const we of weForExercise) {
      const weSets = sets.filter((s) => s.workoutExerciseId === we.id);
      const key = w.id;
      if (!byWorkout.has(key)) {
        byWorkout.set(key, { date: w.startedAt.slice(0, 10), sets: [] });
      }
      byWorkout.get(key)!.sets.push(...weSets);
    }
  }

  return Array.from(byWorkout.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(({ date, sets: wSets }) => {
      let value = 0;
      if (metric === 'weight') {
        value = wSets.reduce((m, s) => Math.max(m, s.weight), 0);
      } else if (metric === 'reps') {
        value = wSets.reduce((m, s) => Math.max(m, s.reps), 0);
      } else {
        value = calcVolume(wSets);
      }
      return { date, value };
    });
}

export function calcCategoryDistribution(
  workoutExercises: WorkoutExercise[],
  sets: WorkoutSet[]
): Record<ExerciseCategory, number> {
  const dist: Record<ExerciseCategory, number> = {
    chest: 0,
    back: 0,
    shoulders: 0,
    arms: 0,
    legs: 0,
  };

  for (const we of workoutExercises) {
    const weSets = sets.filter((s) => s.workoutExerciseId === we.id);
    const volume = calcVolume(weSets);
    dist[we.exerciseCategorySnapshot] = (dist[we.exerciseCategorySnapshot] ?? 0) + volume;
  }

  return dist;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}ч ${m}м`;
  if (m > 0) return `${m}м ${s}с`;
  return `${s}с`;
}

export function formatWeight(weight: number, unit: 'kg' | 'lb'): string {
  if (unit === 'lb') return `${(weight * 2.20462).toFixed(1)} lb`;
  return `${weight} кг`;
}

export function formatVolume(volume: number, unit: 'kg' | 'lb'): string {
  if (unit === 'lb') return `${(volume * 2.20462).toFixed(0)} lb`;
  return `${volume} кг`;
}
