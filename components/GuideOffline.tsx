'use client';

import { useEffect } from 'react';

// Registers the guide-only service worker. Without it the cached aerials
// would sit in storage unreachable — the Cache API stores, the worker serves.
export default function GuideOffline() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);
  return null;
}
