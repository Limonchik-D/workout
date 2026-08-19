export type ExerciseCategory = 'chest' | 'back' | 'shoulders' | 'arms' | 'legs';

export const EXERCISE_CATEGORIES: { value: ExerciseCategory; label: string }[] = [
  { value: 'chest', label: 'Грудь' },
  { value: 'back', label: 'Спина' },
  { value: 'shoulders', label: 'Плечи' },
  { value: 'arms', label: 'Руки' },
  { value: 'legs', label: 'Ноги' },
];

export const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  chest: 'Грудь',
  back: 'Спина',
  shoulders: 'Плечи',
  arms: 'Руки',
  legs: 'Ноги',
};

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  description?: string;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
}

export interface Workout {
  id: string;
  startedAt: string;
  finishedAt?: string;
  status: 'draft' | 'completed';
  durationSeconds?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutExercise {
  id: string;
  workoutId: string;
  exerciseId: string;
  order: number;
  exerciseNameSnapshot: string;
  exerciseCategorySnapshot: ExerciseCategory;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutSet {
  id: string;
  workoutExerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  id: string;
  displayName?: string;
  weightUnit: 'kg' | 'lb';
  defaultRestSeconds: number;
  restPresets: number[];
  timerSoundEnabled: boolean;
  animationsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// Compound types for UI
export interface WorkoutExerciseWithSets extends WorkoutExercise {
  sets: WorkoutSet[];
}

export interface WorkoutWithExercises extends Workout {
  exercises: WorkoutExerciseWithSets[];
}

// Backup schema
export const BACKUP_SCHEMA_VERSION = 1;

export interface BackupData {
  schemaVersion: number;
  exportedAt: string;
  settings: AppSettings | null;
  exercises: Exercise[];
  workouts: Workout[];
  workoutExercises: WorkoutExercise[];
  sets: WorkoutSet[];
}

// Statistics types
export interface ExerciseStats {
  exerciseId: string;
  exerciseName: string;
  exerciseCategory: ExerciseCategory;
  totalSets: number;
  totalVolume: number;
  maxWeight: number;
  maxReps: number;
  sessionCount: number;
  lastUsedAt: string;
}

export interface PeriodStats {
  workoutCount: number;
  totalSets: number;
  totalVolume: number;
  totalDurationSeconds: number;
  longestStreak: number;
}

export type StatPeriod = '7d' | '1m' | '3m' | '6m' | '1y' | 'all';

export interface ChartDataPoint {
  date: string;
  value: number;
}

export type ChartMetric = 'weight' | 'reps' | 'volume';
