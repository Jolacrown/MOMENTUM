'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/web/auth-store-web';

export function AuthInitializer() {
  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);
  return null;
}
