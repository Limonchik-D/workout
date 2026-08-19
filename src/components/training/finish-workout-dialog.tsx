'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { WorkoutWithExercises } from '@/types/domain';
import { formatDuration, calcVolume } from '@/lib/calculations';
import { CheckCircle2 } from 'lucide-react';

interface FinishWorkoutDialogProps {
  open: boolean;
  workout: WorkoutWithExercises;
  durationSeconds: number;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function FinishWorkoutDialog({
  open,
  workout,
  durationSeconds,
  onConfirm,
  onCancel,
}: FinishWorkoutDialogProps) {
  const totalSets = workout.exercises.reduce((s, e) => s + e.sets.length, 0);
  const totalVolume = workout.exercises.reduce(
    (s, e) => s + calcVolume(e.sets),
    0
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-sm bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <DialogTitle>Завершить тренировку?</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Длительность" value={formatDuration(durationSeconds)} />
            <Stat label="Упражнений" value={String(workout.exercises.length)} />
            <Stat label="Подходов" value={String(totalSets)} />
            <Stat label="Объём" value={`${totalVolume} кг`} />
          </div>
        </div>

        <Separator className="opacity-30" />

        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Назад
          </Button>
          <Button className="flex-1" onClick={onConfirm}>
            Завершить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-secondary/40 rounded-xl px-3 py-3 text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
