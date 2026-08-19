'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useState, useCallback } from 'react';
import {
  getAllExercises,
  getActiveExercises,
  createExercise,
  updateExercise,
  archiveExercise,
  restoreExercise,
  searchExercises,
} from '@/lib/db/repositories/exercises';
import type { ExerciseCategory } from '@/types/domain';

export function useExercises() {
  const exercises = useLiveQuery(() => getAllExercises(), []);
  const activeExercises = useLiveQuery(() => getActiveExercises(), []);

  const create = useCallback(
    async (data: { name: string; category: ExerciseCategory; description?: string }) => {
      return createExercise(data);
    },
    []
  );

  const update = useCallback(
    async (id: string, data: Partial<{ name: string; category: ExerciseCategory; description: string }>) => {
      return updateExercise(id, data);
    },
    []
  );

  const archive = useCallback(async (id: string) => {
    return archiveExercise(id);
  }, []);

  const restore = useCallback(async (id: string) => {
    return restoreExercise(id);
  }, []);

  return {
    exercises: exercises ?? [],
    activeExercises: activeExercises ?? [],
    create,
    update,
    archive,
    restore,
    search: searchExercises,
  };
}
