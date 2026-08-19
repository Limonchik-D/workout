'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Flag, Dumbbell, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/layout/app-shell';
import { ExerciseCard } from '@/components/training/exercise-card';
import { AddExerciseDialog } from '@/components/training/add-exercise-dialog';
import { RestTimer } from '@/components/training/rest-timer';
import { FinishWorkoutDialog } from '@/components/training/finish-workout-dialog';
import { WorkoutPageSkeleton } from '@/components/ui/page-skeletons';
import { useWorkout } from '@/hooks/use-workout';
import { useSettings } from '@/hooks/use-settings';
import { formatDuration } from '@/lib/calculations';

export default function WorkoutsPage() {
  const {
    draft,
    workoutWithExercises,
    startWorkout,
    finishCurrentWorkout,
    addExercise,
    removeExercise,
    addSetToExercise,
    updateExerciseSet,
    deleteExerciseSet,
  } = useWorkout();

  const { settings } = useSettings();

  const [addExDialogOpen, setAddExDialogOpen] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [showFinish, setShowFinish] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Elapsed timer
  useEffect(() => {
    if (draft) {
      const update = () => {
        const s = Math.floor((Date.now() - new Date(draft.startedAt).getTime()) / 1000);
        setElapsed(s);
      };
      update();
      intervalRef.current = setInterval(update, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setElapsed(0);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [draft]);

  const handleAddSet = async (workoutExerciseId: string) => {
    if (!workoutWithExercises) return;
    const ex = workoutWithExercises.exercises.find((e) => e.id === workoutExerciseId);
    if (!ex) return;
    const lastSet = ex.sets[ex.sets.length - 1];
    await addSetToExercise(
      workoutExerciseId,
      lastSet?.weight ?? 0,
      lastSet?.reps ?? 10,
      ex.sets.length + 1
    );
  };

  const handleFinish = async () => {
    await finishCurrentWorkout();
    setShowFinish(false);
    toast.success('Тренировка завершена!');
  };

  // useLiveQuery returns undefined while loading — show skeleton
  // null means "loaded, no draft"; undefined means "still loading"
  if (draft === undefined || workoutWithExercises === undefined) {
    return (
      <AppShell>
        <WorkoutPageSkeleton />
      </AppShell>
    );
  }

  // No active draft — show start screen
  if (!draft || !workoutWithExercises) {
    return (
      <AppShell>
        <div className="flex flex-col flex-1 items-center justify-center px-6 py-20 text-center animate-in fade-in duration-300">
          <div className="rounded-full bg-primary/15 p-5 mb-6 ring-1 ring-primary/20">
            <Dumbbell className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Workout Tracker</h1>
          <p className="text-muted-foreground mb-8 max-w-xs text-sm leading-relaxed">
            Ведите учёт тренировок, отслеживайте прогресс и анализируйте результаты
          </p>
          <Button size="lg" onClick={startWorkout} className="px-10 text-base h-12 gap-2">
            <Zap className="h-5 w-5" />
            Начать тренировку
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col max-w-2xl mx-auto w-full px-4 py-5 gap-4">
        {/* Header */}
        <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
          <div>
            <h1 className="text-xl font-bold">Тренировка</h1>
            <p className="text-sm text-muted-foreground tabular-nums">{formatDuration(elapsed)}</p>
          </div>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setShowFinish(true)}
          >
            <Flag className="h-4 w-4" />
            Завершить
          </Button>
        </div>

        {/* Exercise list */}
        <div className="space-y-3">
          {workoutWithExercises.exercises.length === 0 && (
            <div className="text-center py-10 text-muted-foreground animate-in fade-in duration-300">
              <p className="text-sm">Нет упражнений — добавьте первое</p>
            </div>
          )}
          {workoutWithExercises.exercises.map((ex, i) => (
            <div
              key={ex.id}
              className="animate-in fade-in slide-in-from-bottom-2 duration-200"
              style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}
            >
              <ExerciseCard
                exercise={ex}
                weightUnit={settings?.weightUnit ?? 'kg'}
                onAddSet={handleAddSet}
                onUpdateSet={updateExerciseSet}
                onDeleteSet={deleteExerciseSet}
                onRemove={removeExercise}
                onStartTimer={() => setShowTimer(true)}
              />
            </div>
          ))}
        </div>

        {/* Add exercise */}
        <Button
          variant="outline"
          className="w-full h-11 border-dashed border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
          onClick={() => setAddExDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Добавить упражнение
        </Button>

        {/* Rest timer */}
        {showTimer && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-200">
            <RestTimer
              presets={settings?.restPresets ?? [30, 60, 90, 120, 180]}
              defaultSeconds={settings?.defaultRestSeconds ?? 90}
              soundEnabled={settings?.timerSoundEnabled ?? true}
              onClose={() => setShowTimer(false)}
            />
          </div>
        )}

        {/* Bottom spacer for mobile nav */}
        <div className="h-2" />
      </div>

      <AddExerciseDialog
        open={addExDialogOpen}
        onClose={() => setAddExDialogOpen(false)}
        onSelect={addExercise}
      />

      {showFinish && (
        <FinishWorkoutDialog
          open={showFinish}
          workout={workoutWithExercises}
          durationSeconds={elapsed}
          onConfirm={handleFinish}
          onCancel={() => setShowFinish(false)}
        />
      )}
    </AppShell>
  );
}

