'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'wake_lock_enabled';

export function useWakeLock() {
  const isSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator && navigator.wakeLock !== null;
  const [isActive, setIsActive] = useState(false);
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  const acquire = useCallback(async () => {
    if (!isSupported) return;
    try {
      sentinelRef.current = await navigator.wakeLock.request('screen');
      sentinelRef.current.addEventListener('release', () => {
        sentinelRef.current = null;
        setIsActive(false);
      });
      setIsActive(true);
    } catch {
      setIsActive(false);
    }
  }, [isSupported]);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === 'true') {
      acquire();
    }
  }, [acquire]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isActive && !sentinelRef.current) {
        acquire();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isActive, acquire]);

  const toggle = useCallback(async () => {
    if (isActive) {
      await sentinelRef.current?.release();
      sentinelRef.current = null;
      setIsActive(false);
      localStorage.setItem(STORAGE_KEY, 'false');
    } else {
      await acquire();
      localStorage.setItem(STORAGE_KEY, 'true');
    }
  }, [isActive, acquire]);

  return { isSupported, isActive, toggle };
}
