import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db/dexie';
import type { Exercise, ExerciseCategory } from '@/types/domain';

function now(): string {
  return new Date().toISOString();
}

export async function getAllExercises(): Promise<Exercise[]> {
  return db.exercises.orderBy('name').toArray();
}

export async function getActiveExercises(): Promise<Exercise[]> {
  return db.exercises.where('status').equals('active').sortBy('name');
}

export async function getArchivedExercises(): Promise<Exercise[]> {
  return db.exercises.where('status').equals('archived').sortBy('name');
}

export async function getExerciseById(id: string): Promise<Exercise | undefined> {
  return db.exercises.get(id);
}

export async function searchExercises(query: string): Promise<Exercise[]> {
  const lq = query.toLowerCase().trim();
  if (!lq) return getActiveExercises();
  const all = await getActiveExercises();
  return all.filter((e) => e.name.toLowerCase().includes(lq));
}

export async function createExercise(data: {
  name: string;
  category: ExerciseCategory;
  description?: string;
}): Promise<Exercise> {
  const exercise: Exercise = {
    id: uuidv4(),
    name: data.name.trim(),
    category: data.category,
    description: data.description?.trim(),
    status: 'active',
    createdAt: now(),
    updatedAt: now(),
  };
  await db.exercises.add(exercise);
  return exercise;
}

export async function updateExercise(
  id: string,
  data: Partial<Pick<Exercise, 'name' | 'category' | 'description'>>
): Promise<void> {
  await db.exercises.update(id, { ...data, updatedAt: now() });
}

export async function archiveExercise(id: string): Promise<void> {
  await db.exercises.update(id, { status: 'archived', updatedAt: now() });
}

export async function restoreExercise(id: string): Promise<void> {
  await db.exercises.update(id, { status: 'active', updatedAt: now() });
}

export async function deleteExercise(id: string): Promise<void> {
  await db.exercises.delete(id);
}

export async function touchExerciseLastUsed(id: string): Promise<void> {
  await db.exercises.update(id, { lastUsedAt: now(), updatedAt: now() });
}

export async function importExercises(exercises: Exercise[]): Promise<void> {
  await db.exercises.bulkPut(exercises);
}
