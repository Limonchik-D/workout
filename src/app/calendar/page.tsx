'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CalendarDays } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/layout/app-shell';
import { CalendarPageSkeleton } from '@/components/ui/page-skeletons';
import { db } from '@/lib/db/dexie';
import { getWorkoutWithExercises } from '@/lib/db/repositories/workouts';
import { formatDuration, calcVolume } from '@/lib/calculations';
import { CATEGORY_LABELS } from '@/types/domain';
import { cn } from '@/lib/utils';
import type { Workout, WorkoutWithExercises } from '@/types/domain';

const MONTH_NAMES = [
  'Январь','Февраль','Март','Апрель','Май','Июнь',
  'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь',
];
const DAY_NAMES = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutWithExercises | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const completedWorkouts = useLiveQuery(
    () => db.workouts.where('status').equals('completed').toArray(),
    []
  );

  const allWorkoutExercises = useLiveQuery(() => db.workoutExercises.toArray(), []);
  const allSets = useLiveQuery(() => db.sets.toArray(), []);

  const workoutDays = useMemo(() => {
    const map = new Map<string, Workout>();
    (completedWorkouts ?? []).forEach((w) => {
      const day = w.startedAt.slice(0, 10);
      if (!map.has(day) || new Date(w.startedAt) > new Date(map.get(day)!.startedAt)) {
        map.set(day, w);
      }
    });
    return map;
  }, [completedWorkouts]);

  // Calendar grid
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Make Monday first day
  const startDow = (firstDay.getDay() + 6) % 7;
  const days: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);

  const monthStats = useMemo(() => {
    const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-31`;
    const ws = (completedWorkouts ?? []).filter(
      (w) => w.startedAt >= monthStart && w.startedAt <= monthEnd
    );
    const dur = ws.reduce((s, w) => s + (w.durationSeconds ?? 0), 0);

    const wIds = new Set(ws.map((w) => w.id));
    const wes = (allWorkoutExercises ?? []).filter((we) => wIds.has(we.workoutId));
    const weIds = new Set(wes.map((we) => we.id));
    const sets = (allSets ?? []).filter((s) => weIds.has(s.workoutExerciseId));
    const totalSets = sets.length;
    const totalVolume = Math.round(calcVolume(sets));

    return { count: ws.length, duration: dur, totalSets, totalVolume };
  }, [completedWorkouts, allWorkoutExercises, allSets, year, month]);

  const handleDayClick = async (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const workout = workoutDays.get(dateStr);
    if (!workout) { setSelectedDate(null); setSelectedWorkout(null); return; }
    setSelectedDate(dateStr);
    setLoadingDetail(true);
    const detail = await getWorkoutWithExercises(workout.id);
    setSelectedWorkout(detail ?? null);
    setLoadingDetail(false);
  };

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };

  // Loading state
  if (completedWorkouts === undefined || allWorkoutExercises === undefined || allSets === undefined) {
    return (
      <AppShell>
        <CalendarPageSkeleton />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto w-full px-4 py-5 space-y-5">
        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setYear((y) => y - 1)}>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-base font-semibold">
            {MONTH_NAMES[month]} {year}
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setYear((y) => y + 1)}>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="grid grid-cols-7 border-b border-border">
            {DAY_NAMES.map((d) => (
              <div key={d} className="text-center text-xs text-muted-foreground py-2 font-medium">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} className="h-10" />;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const todayStr = today.toISOString().slice(0, 10);
              const isToday = dateStr === todayStr;
              const hasWorkout = workoutDays.has(dateStr);
              const isSelected = selectedDate === dateStr;

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    'h-10 flex flex-col items-center justify-center text-sm transition-colors rounded-lg mx-0.5 my-0.5',
                    isToday && !isSelected && 'font-bold text-primary',
                    isSelected && 'bg-primary text-primary-foreground',
                    !isSelected && hasWorkout && 'hover:bg-primary/20',
                    !isSelected && !hasWorkout && 'hover:bg-secondary/40 text-muted-foreground'
                  )}
                >
                  <span>{day}</span>
                  {hasWorkout && !isSelected && (
                    <span className="h-1 w-1 rounded-full bg-primary mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Monthly summary */}
        {monthStats.count > 0 ? (
          <div className="grid grid-cols-2 gap-3 animate-in fade-in duration-300">
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-2xl font-bold">{monthStats.count}</p>
              <p className="text-xs text-muted-foreground mt-0.5">тренировок</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-2xl font-bold">{formatDuration(monthStats.duration)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">общее время</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-2xl font-bold">{monthStats.totalSets}</p>
              <p className="text-xs text-muted-foreground mt-0.5">подходов</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-2xl font-bold">{monthStats.totalVolume.toLocaleString('ru')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">объём, кг</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground animate-in fade-in duration-300">
            <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">В этом месяце тренировок нет</p>
          </div>
        )}

        {/* Day detail */}
        {selectedDate && (
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {loadingDetail ? (
              <div className="space-y-3 py-2">
                {[1, 2].map((i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="h-4 bg-muted rounded animate-pulse w-36" />
                    <div className="flex gap-1.5">
                      {[1, 2, 3].map((j) => (
                        <div key={j} className="h-7 w-20 bg-muted rounded animate-pulse" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : selectedWorkout ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">
                    {new Date(selectedDate + 'T12:00:00').toLocaleDateString('ru-RU', {
                      day: 'numeric', month: 'long',
                    })}
                  </h3>
                  {selectedWorkout.durationSeconds && (
                    <span className="text-sm text-muted-foreground">
                      {formatDuration(selectedWorkout.durationSeconds)}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {selectedWorkout.exercises.map((ex) => (
                    <div key={ex.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{ex.exerciseNameSnapshot}</span>
                        <span className="text-xs text-muted-foreground">
                          {CATEGORY_LABELS[ex.exerciseCategorySnapshot]}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {ex.sets.map((s, i) => (
                          <span
                            key={s.id}
                            className="text-xs bg-secondary/40 rounded-md px-2 py-1"
                          >
                            {i + 1}. {s.weight} кг × {s.reps}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground pt-1">
                  Объём: {selectedWorkout.exercises.reduce((s, e) => s + calcVolume(e.sets), 0)} кг ·{' '}
                  {selectedWorkout.exercises.reduce((s, e) => s + e.sets.length, 0)} подходов
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-4">Нет данных</p>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
