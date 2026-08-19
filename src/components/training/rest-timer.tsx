'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Pause, Play, RotateCcw, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRestTimer } from '@/hooks/use-rest-timer';
import { cn } from '@/lib/utils';

const PRESET_LABELS: Record<number, string> = {
  30: '30с',
  60: '1м',
  90: '1:30',
  120: '2м',
  180: '3м',
};

interface RestTimerProps {
  presets: number[];
  defaultSeconds: number;
  soundEnabled: boolean;
  onClose: () => void;
}

export function RestTimer({ presets, defaultSeconds, soundEnabled, onClose }: RestTimerProps) {
  const [customInput, setCustomInput] = useState('');
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
    } catch {
      // AudioContext may not be available
    }
  };

  const { remaining, isRunning, isActive, progress, start, pause, resume, reset } = useRestTimer({
    onComplete: playBeep,
  });

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const timeStr = `${minutes}:${String(seconds).padStart(2, '0')}`;

  // SVG circle progress
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Таймер отдыха</span>
        </div>
        <button
          onClick={onClose}
          className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
          aria-label="Закрыть таймер"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Circular timer */}
      <div className="flex justify-center">
        <div className="relative h-36 w-36 flex items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-secondary"
            />
            {/* Progress circle */}
            {isActive && (
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                className="text-primary transition-all duration-1000"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset,
                }}
              />
            )}
          </svg>
          <span
            className={cn(
              'text-4xl font-bold tabular-nums transition-colors',
              !isActive && 'text-muted-foreground'
            )}
          >
            {isActive ? timeStr : '0:00'}
          </span>
        </div>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-2 justify-center">
        {presets.map((s) => (
          <button
            key={s}
            onClick={() => start(s)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              'border border-border hover:border-primary/50 hover:text-primary hover:bg-primary/10',
              isActive && remaining === s && isRunning ? 'border-primary bg-primary/15 text-primary' : 'text-muted-foreground'
            )}
          >
            {PRESET_LABELS[s] ?? `${s}с`}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {isActive ? (
          <>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => (isRunning ? pause() : resume())}
            >
              {isRunning ? (
                <><Pause className="h-4 w-4 mr-1.5" />Пауза</>
              ) : (
                <><Play className="h-4 w-4 mr-1.5" />Продолжить</>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={reset}
              className="h-9 w-9 p-0"
              aria-label="Сбросить"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <div className="flex gap-2 w-full">
            <input
              type="number"
              placeholder="Сек..."
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              className="flex-1 h-9 rounded-lg border border-border bg-secondary/30 px-3 text-sm text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              min={1}
            />
            <Button
              size="sm"
              className="flex-1"
              onClick={() => {
                const n = parseInt(customInput, 10);
                if (n > 0) start(n);
                else start(defaultSeconds);
                setCustomInput('');
              }}
            >
              <Play className="h-4 w-4 mr-1.5" />
              Старт
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
