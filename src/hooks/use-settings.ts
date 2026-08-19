'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useMemo } from 'react';
import { db } from '@/lib/db/dexie';
import { updateSettings } from '@/lib/db/repositories/settings';
import type { AppSettings } from '@/types/domain';

const DEFAULT_SETTINGS: AppSettings = {
  id: 'default',
  weightUnit: 'kg',
  defaultRestSeconds: 90,
  restPresets: [30, 60, 90, 120, 180],
  timerSoundEnabled: true,
  animationsEnabled: true,
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
};

export function useSettings() {
  // Call db directly — avoids wrapping function breaking Dexie v4 zone tracking
  const row = useLiveQuery(() => db.settings.get('default'), []);

  // undefined = loading, null = no row yet → use defaults
  const settings = useMemo<AppSettings | null>(() => {
    if (row === undefined) return null;
    return row ?? DEFAULT_SETTINGS;
  }, [row]);

  const update = useCallback(
    async (data: Parameters<typeof updateSettings>[0]) => {
      return updateSettings(data);
    },
    []
  );

  return { settings, updateSettings: update };
}
