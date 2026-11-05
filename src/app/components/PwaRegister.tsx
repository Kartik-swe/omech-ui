'use client';

import { useEffect } from 'react';

/** Registers the service worker that makes the app installable (see public/sw.js). */
const PwaRegister = () => {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* installability is optional - never break the app */
    });
  }, []);
  return null;
};

export default PwaRegister;
