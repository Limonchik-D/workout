'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, MoreVertical, Plus, GripVertical, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SetRow } from './set-row';
import type { WorkoutExerciseWithSets } from '@/types/domain';
import { CATEGORY_LABELS } from '@/types/domain';
import { cn } from '@/lib/utils';

interface ExerciseCardProps {
  exercise: WorkoutExerciseWithSets;
  weightUnit: 'kg' | 'lb';
  onAddSet: (workoutExerciseId: string) => Promise<void>;
  onUpdateSet: (setId: string, data: { weight?: number; reps?: number }) => Promise<void>;
  onDeleteSet: (setId: string) => Promise<void>;
  onRemove: (workoutExerciseId: string) => Promise<void>;
  onStartTimer: () => void;
  defaultExpanded?: boolean;
}

export function ExerciseCard({
  exercise,
  weightUnit,
  onAddSet,
  onUpdateSet,
  onDeleteSet,
  onRemove,
  onStartTimer,
  defaultExpanded = false,
}: ExerciseCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const handleAddSet = async () => {
    await onAddSet(exercise.id);
  };

  const totalVolume = exercise.sets.reduce((s, set) => s + set.weight * set.reps, 0);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-sm hover:border-border/80">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none"
        onClick={() => setExpanded((p) => !p)}
        role="button"
        aria-expanded={expanded}
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? setExpanded((p) => !p) : undefined}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm truncate">{exercise.exerciseNameSnapshot}</span>
            <Badge variant="secondary" className="text-xs shrink-0">
              {CATEGORY_LABELS[exercise.exerciseCategorySnapshot]}
            </Badge>
          </div>
          {exercise.sets.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {exercise.sets.length} подх. · {totalVolume > 0 ? `${totalVolume} кг` : ''}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              aria-label="Меню упражнения"
            >
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => { e.stopPropagation(); onRemove(exercise.id); }}
              >
                Удалить упражнение
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground transition-transform duration-150" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-150" />
          )}
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className="px-4 pb-3 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Column headers */}
          {exercise.sets.length > 0 && (
            <div className="flex items-center gap-2 px-1 mb-1">
              <span className="w-6" />
              <span className="flex-1 text-center text-xs text-muted-foreground">Вес</span>
              <span className="w-4" />
              <span className="flex-1 text-center text-xs text-muted-foreground">Повт.</span>
              <span className="w-8" />
              <span className="w-8" />
            </div>
          )}

          {exercise.sets.map((set, i) => (
            <div
              key={set.id}
              className="animate-in fade-in duration-150"
              style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}
            >
              <SetRow
                set={set}
                index={i}
                weightUnit={weightUnit}
                onUpdate={onUpdateSet}
                onDelete={onDeleteSet}
              />
            </div>
          ))}

          <div className="flex gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs border-border/50"
              onClick={handleAddSet}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Подход
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 border-border/50"
              onClick={onStartTimer}
              aria-label="Запустить таймер отдыха"
            >
              <Timer className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
