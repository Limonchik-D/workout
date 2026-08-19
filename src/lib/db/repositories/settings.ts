import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db/dexie';
import type { AppSettings } from '@/types/domain';

function now(): string {
  return new Date().toISOString();
}

const DEFAULT_SETTINGS_ID = 'default';

const DEFAULT_SETTINGS: AppSettings = {
  id: DEFAULT_SETTINGS_ID,
  weightUnit: 'kg',
  defaultRestSeconds: 90,
  restPresets: [30, 60, 90, 120, 180],
  timerSoundEnabled: true,
  animationsEnabled: true,
  createdAt: now(),
  updatedAt: now(),
};

/** Read-only: safe to call inside liveQuery */
export async function getSettings(): Promise<AppSettings> {
  const settings = await db.settings.get(DEFAULT_SETTINGS_ID);
  return settings ?? DEFAULT_SETTINGS;
}

/** Write: initialises default row if absent. Call once on app boot, NOT inside liveQuery */
export async function ensureDefaultSettings(): Promise<void> {
  const existing = await db.settings.get(DEFAULT_SETTINGS_ID);
  if (!existing) {
    await db.settings.put(DEFAULT_SETTINGS);
  }
}

export async function updateSettings(
  data: Partial<Omit<AppSettings, 'id' | 'createdAt'>>
): Promise<void> {
  const existing = await getSettings();
  await db.settings.put({ ...existing, ...data, updatedAt: now() });
}

export async function clearAllData(): Promise<void> {
  await db.transaction('rw', db.exercises, db.workouts, db.workoutExercises, db.sets, db.settings, async () => {
    await db.exercises.clear();
    await db.workouts.clear();
    await db.workoutExercises.clear();
    await db.sets.clear();
    await db.settings.clear();
  });
}

export async function importSettings(settings: AppSettings | null): Promise<void> {
  if (settings) {
    await db.settings.put({ ...settings, id: DEFAULT_SETTINGS_ID });
  }
}
