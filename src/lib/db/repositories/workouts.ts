import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db/dexie';
import type { Workout, WorkoutExercise, WorkoutExerciseWithSets, WorkoutWithExercises } from '@/types/domain';
import { getSetsForWorkoutExercise, deleteSetsByWorkoutExercise, importSets } from './sets';
import type { WorkoutSet } from '@/types/domain';

function now(): string {
  return new Date().toISOString();
}

export async function getDraftWorkout(): Promise<Workout | undefined> {
  return db.workouts.where('status').equals('draft').first();
}

export async function getAllCompletedWorkouts(): Promise<Workout[]> {
  return db.workouts.where('status').equals('completed').reverse().sortBy('startedAt');
}

export async function getWorkoutById(id: string): Promise<Workout | undefined> {
  return db.workouts.get(id);
}

export async function getWorkoutsByMonth(year: number, month: number): Promise<Workout[]> {
  const start = new Date(year, month, 1).toISOString();
  const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
  return db.workouts
    .where('startedAt')
    .between(start, end, true, true)
    .and((w) => w.status === 'completed')
    .toArray();
}

export async function createWorkout(): Promise<Workout> {
  const workout: Workout = {
    id: uuidv4(),
    startedAt: now(),
    status: 'draft',
    createdAt: now(),
    updatedAt: now(),
  };
  await db.workouts.add(workout);
  return workout;
}

export async function updateWorkout(
  id: string,
  data: Partial<Pick<Workout, 'notes' | 'status' | 'finishedAt' | 'durationSeconds'>>
): Promise<void> {
  await db.workouts.update(id, { ...data, updatedAt: now() });
}

export async function finishWorkout(id: string, durationSeconds: number): Promise<void> {
  await db.workouts.update(id, {
    status: 'completed',
    finishedAt: now(),
    durationSeconds,
    updatedAt: now(),
  });
}

export async function deleteWorkout(id: string): Promise<void> {
  const exercises = await db.workoutExercises.where('workoutId').equals(id).toArray();
  for (const we of exercises) {
    await deleteSetsByWorkoutExercise(we.id);
  }
  await db.workoutExercises.where('workoutId').equals(id).delete();
  await db.workouts.delete(id);
}

// WorkoutExercise operations
export async function getWorkoutExercises(workoutId: string): Promise<WorkoutExercise[]> {
  return db.workoutExercises.where('workoutId').equals(workoutId).sortBy('order');
}

export async function addExerciseToWorkout(
  workoutId: string,
  exerciseId: string,
  exerciseName: string,
  exerciseCategory: WorkoutExercise['exerciseCategorySnapshot']
): Promise<WorkoutExercise> {
  const existing = await db.workoutExercises.where('workoutId').equals(workoutId).toArray();
  const order = existing.length;
  const we: WorkoutExercise = {
    id: uuidv4(),
    workoutId,
    exerciseId,
    order,
    exerciseNameSnapshot: exerciseName,
    exerciseCategorySnapshot: exerciseCategory,
    createdAt: now(),
    updatedAt: now(),
  };
  await db.workoutExercises.add(we);
  await db.workouts.update(workoutId, { updatedAt: now() });
  return we;
}

export async function removeExerciseFromWorkout(workoutExerciseId: string): Promise<void> {
  await deleteSetsByWorkoutExercise(workoutExerciseId);
  await db.workoutExercises.delete(workoutExerciseId);
}

export async function reorderWorkoutExercises(
  workoutId: string,
  orderedIds: string[]
): Promise<void> {
  await db.transaction('rw', db.workoutExercises, async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.workoutExercises.update(orderedIds[i], { order: i, updatedAt: now() });
    }
  });
}

export async function getWorkoutWithExercises(workoutId: string): Promise<WorkoutWithExercises | undefined> {
  const workout = await getWorkoutById(workoutId);
  if (!workout) return undefined;

  const workoutExercises = await getWorkoutExercises(workoutId);
  const exercisesWithSets: WorkoutExerciseWithSets[] = [];

  for (const we of workoutExercises) {
    const sets = await getSetsForWorkoutExercise(we.id);
    exercisesWithSets.push({ ...we, sets });
  }

  return { ...workout, exercises: exercisesWithSets };
}

export async function importWorkouts(
  workouts: Workout[],
  workoutExercises: WorkoutExercise[],
  sets: WorkoutSet[]
): Promise<void> {
  await db.transaction('rw', db.workouts, db.workoutExercises, db.sets, async () => {
    await db.workouts.bulkPut(workouts);
    await db.workoutExercises.bulkPut(workoutExercises);
    await importSets(sets);
  });
}
