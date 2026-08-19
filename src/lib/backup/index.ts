import type { BackupData } from '@/types/domain';
import { BACKUP_SCHEMA_VERSION } from '@/types/domain';
import { db } from '@/lib/db/dexie';
import { getSettings, importSettings } from '@/lib/db/repositories/settings';
import { importExercises } from '@/lib/db/repositories/exercises';
import { importWorkouts } from '@/lib/db/repositories/workouts';

export async function exportBackup(): Promise<BackupData> {
  const [settings, exercises, workouts, workoutExercises, sets] = await Promise.all([
    getSettings(),
    db.exercises.toArray(),
    db.workouts.toArray(),
    db.workoutExercises.toArray(),
    db.sets.toArray(),
  ]);

  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    settings,
    exercises,
    workouts,
    workoutExercises,
    sets,
  };
}

export function downloadBackup(data: BackupData): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const date = new Date().toISOString().slice(0, 10);
  a.download = `workout-tracker-backup-${date}.workout.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseBackupFile(content: string): BackupData {
  let data: unknown;
  try {
    data = JSON.parse(content);
  } catch {
    throw new Error('Файл повреждён или не является JSON');
  }

  if (
    typeof data !== 'object' ||
    data === null ||
    !('schemaVersion' in data) ||
    typeof (data as Record<string, unknown>).schemaVersion !== 'number'
  ) {
    throw new Error('Неверный формат резервной копии');
  }

  const d = data as BackupData;

  if (d.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw new Error(`Неподдерживаемая версия схемы: ${d.schemaVersion}`);
  }

  if (!Array.isArray(d.exercises) || !Array.isArray(d.workouts) || !Array.isArray(d.sets)) {
    throw new Error('Структура данных повреждена');
  }

  return d;
}

export async function importBackup(data: BackupData, mode: 'replace' | 'merge'): Promise<void> {
  if (mode === 'replace') {
    await db.transaction(
      'rw',
      db.exercises,
      db.workouts,
      db.workoutExercises,
      db.sets,
      db.settings,
      async () => {
        await db.exercises.clear();
        await db.workouts.clear();
        await db.workoutExercises.clear();
        await db.sets.clear();
        await db.settings.clear();
        await importSettings(data.settings);
        await importExercises(data.exercises);
        await importWorkouts(data.workouts, data.workoutExercises, data.sets);
      }
    );
  } else {
    // merge: bulkPut uses IDs to avoid duplicates
    await db.transaction(
      'rw',
      db.exercises,
      db.workouts,
      db.workoutExercises,
      db.sets,
      async () => {
        await importExercises(data.exercises);
        await importWorkouts(data.workouts, data.workoutExercises, data.sets);
      }
    );
  }
}
