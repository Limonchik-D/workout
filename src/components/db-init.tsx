'use client';

import { useEffect } from 'react';
import { ensureDefaultSettings } from '@/lib/db/repositories/settings';

export function DbInit() {
  useEffect(() => {
    ensureDefaultSettings();
  }, []);

  return null;
}
