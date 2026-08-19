import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db/dexie';
import type { WorkoutSet } from '@/types/domain';

function now(): string {
  return new Date().toISOString();
}

export async function getSetsForWorkoutExercise(workoutExerciseId: string): Promise<WorkoutSet[]> {
  return db.sets.where('workoutExerciseId').equals(workoutExerciseId).sortBy('setNumber');
}

export async function addSet(data: {
  workoutExerciseId: string;
  weight: number;
  reps: number;
  setNumber: number;
}): Promise<WorkoutSet> {
  const set: WorkoutSet = {
    id: uuidv4(),
    workoutExerciseId: data.workoutExerciseId,
    setNumber: data.setNumber,
    weight: data.weight,
    reps: data.reps,
    completedAt: now(),
    createdAt: now(),
    updatedAt: now(),
  };
  await db.sets.add(set);
  return set;
}

export async function updateSet(
  id: string,
  data: Partial<Pick<WorkoutSet, 'weight' | 'reps' | 'setNumber'>>
): Promise<void> {
  await db.sets.update(id, { ...data, updatedAt: now() });
}

export async function deleteSet(id: string): Promise<void> {
  await db.sets.delete(id);
}

export async function deleteSetsByWorkoutExercise(workoutExerciseId: string): Promise<void> {
  await db.sets.where('workoutExerciseId').equals(workoutExerciseId).delete();
}

export async function getAllSets(): Promise<WorkoutSet[]> {
  return db.sets.toArray();
}

export async function importSets(sets: WorkoutSet[]): Promise<void> {
  await db.sets.bulkPut(sets);
}
