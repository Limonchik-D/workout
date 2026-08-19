'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { WorkoutSet } from '@/types/domain';
import { cn } from '@/lib/utils';

interface SetRowProps {
  set: WorkoutSet;
  index: number;
  weightUnit: 'kg' | 'lb';
  onUpdate: (id: string, data: { weight?: number; reps?: number }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function SetRow({ set, index, weightUnit, onUpdate, onDelete }: SetRowProps) {
  const [weight, setWeight] = useState(String(set.weight));
  const [reps, setReps] = useState(String(set.reps));
  const [isDone, setIsDone] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setWeight(String(set.weight));
    setReps(String(set.reps));
  }, [set.weight, set.reps]);

  // Clear pending save on unmount to avoid setState after unmount
  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, []);

  const scheduleUpdate = (newWeight: string, newReps: string) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      const w = parseFloat(newWeight);
      const r = parseInt(newReps, 10);
      if (!isNaN(w) && w >= 0 && !isNaN(r) && r > 0) {
        await onUpdate(set.id, { weight: w, reps: r });
      }
    }, 600);
  };

  const handleWeightChange = (v: string) => {
    setWeight(v);
    scheduleUpdate(v, reps);
  };

  const handleRepsChange = (v: string) => {
    setReps(v);
    scheduleUpdate(weight, v);
  };

  const handleDone = () => {
    setIsDone((prev) => !prev);
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-1 py-1.5 rounded-lg transition-colors duration-150',
        isDone && 'opacity-60'
      )}
    >
      {/* Set number */}
      <span className="w-6 text-center text-sm font-medium text-muted-foreground shrink-0">
        {index + 1}
      </span>

      {/* Weight */}
      <div className="flex-1 relative">
        <Input
          type="number"
          value={weight}
          onChange={(e) => handleWeightChange(e.target.value)}
          className="h-9 text-center bg-secondary/30 border-border/50 text-sm pr-7 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          min={0}
          step={0.5}
          inputMode="decimal"
          aria-label={`Вес подхода ${index + 1}`}
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
          {weightUnit}
        </span>
      </div>

      <span className="text-muted-foreground text-sm">×</span>

      {/* Reps */}
      <div className="flex-1 relative">
        <Input
          type="number"
          value={reps}
          onChange={(e) => handleRepsChange(e.target.value)}
          className="h-9 text-center bg-secondary/30 border-border/50 text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          min={1}
          step={1}
          inputMode="numeric"
          aria-label={`Повторения подхода ${index + 1}`}
        />
      </div>

      {/* Done button */}
      <button
        onClick={handleDone}
        className={cn(
          'h-8 w-8 shrink-0 rounded-lg flex items-center justify-center transition-colors',
          isDone
            ? 'bg-primary/20 text-primary'
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
        )}
        aria-label="Отметить подход"
      >
        <Check className="h-4 w-4" strokeWidth={isDone ? 2.5 : 2} />
      </button>

      {/* Delete button */}
      <button
        onClick={() => onDelete(set.id)}
        className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        aria-label="Удалить подход"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
