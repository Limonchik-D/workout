'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseRestTimerOptions {
  onComplete?: () => void;
}

export function useRestTimer({ onComplete }: UseRestTimerOptions = {}) {
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return clear;
  }, [clear]);

  const start = useCallback((seconds: number) => {
    clear();
    setTotalSeconds(seconds);
    setRemaining(seconds);
    setIsRunning(true);

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setIsRunning(false);
          onCompleteRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clear]);

  const pause = useCallback(() => {
    clear();
    setIsRunning(false);
  }, [clear]);

  const resume = useCallback(() => {
    if (remaining <= 0) return;
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setIsRunning(false);
          onCompleteRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [remaining]);

  const reset = useCallback(() => {
    clear();
    setRemaining(0);
    setTotalSeconds(0);
    setIsRunning(false);
  }, [clear]);

  const progress = totalSeconds > 0 ? ((totalSeconds - remaining) / totalSeconds) * 100 : 0;
  const isActive = totalSeconds > 0;

  return {
    totalSeconds,
    remaining,
    isRunning,
    isActive,
    progress,
    start,
    pause,
    resume,
    reset,
  };
}
