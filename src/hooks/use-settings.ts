'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback } from 'react';
import { getSettings, updateSettings } from '@/lib/db/repositories/settings';

export function useSettings() {
  const settings = useLiveQuery(() => getSettings(), []);

  const update = useCallback(
    async (data: Parameters<typeof updateSettings>[0]) => {
      return updateSettings(data);
    },
    []
  );

  return { settings: settings ?? null, updateSettings: update };
}
