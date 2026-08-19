import Dexie, { Table } from 'dexie';
import type { Exercise, Workout, WorkoutExercise, WorkoutSet, AppSettings } from '@/types/domain';

export class WorkoutTrackerDB extends Dexie {
  exercises!: Table<Exercise>;
  workouts!: Table<Workout>;
  workoutExercises!: Table<WorkoutExercise>;
  sets!: Table<WorkoutSet>;
  settings!: Table<AppSettings>;

  constructor() {
    super('WorkoutTrackerDB');
    this.version(1).stores({
      exercises: 'id, name, category, status, createdAt, lastUsedAt',
      workouts: 'id, status, startedAt, finishedAt, createdAt',
      workoutExercises: 'id, workoutId, exerciseId, order',
      sets: 'id, workoutExerciseId, setNumber',
      settings: 'id',
    });
  }
}

export const db = new WorkoutTrackerDB();
