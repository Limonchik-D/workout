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
  const [selectedWorkouts, setSelectedWorkouts] = useState<WorkoutWithExercises[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const completedWorkouts = useLiveQuery(
    () => db.workouts.where('status').equals('completed').toArray(),
    []
  );

  const allWorkoutExercises = useLiveQuery(() => db.workoutExercises.toArray(), []);
  const allSets = useLiveQuery(() => db.sets.toArray(), []);

  const workoutDays = useMemo(() => {
    const map = new Map<string, Workout[]>();
    (completedWorkouts ?? []).forEach((w) => {
      const day = w.startedAt.slice(0, 10);
      const arr = map.get(day) ?? [];
      map.set(day, [...arr, w].sort((a, b) => a.startedAt.localeCompare(b.startedAt)));
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
    const dayWorkouts = workoutDays.get(dateStr);
    if (!dayWorkouts?.length) { setSelectedDate(null); setSelectedWorkouts([]); return; }
    setSelectedDate(dateStr);
    setLoadingDetail(true);
    const details = await Promise.all(dayWorkouts.map((w) => getWorkoutWithExercises(w.id)));
    setSelectedWorkouts(details.filter((d): d is WorkoutWithExercises => d != null));
    setLoadingDetail(false);
  };

  const prevMonth = () => {
    setSelectedDate(null); setSelectedWorkouts([]);
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    setSelectedDate(null); setSelectedWorkouts([]);
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
                    !isSelected && !isToday && !hasWorkout && 'text-muted-foreground hover:bg-secondary/40',
                    !isSelected && !isToday && hasWorkout && 'hover:bg-primary/20',
                    isToday && !isSelected && 'font-bold text-primary',
                    isToday && !isSelected && hasWorkout && 'bg-primary/10',
                    isSelected && 'bg-primary text-primary-foreground font-semibold'
                  )}
                >
                  <span>{day}</span>
                  {hasWorkout && !isSelected && (
                    <span className={cn('h-1 w-1 rounded-full mt-0.5', isToday ? 'bg-primary' : 'bg-primary/60')} />
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
          <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-semibold text-sm">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
              </h3>
              {selectedWorkouts.length > 1 && (
                <span className="text-xs text-muted-foreground">{selectedWorkouts.length} тренировки</span>
              )}
            </div>

            {loadingDetail ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse w-32" />
                    <div className="h-3 bg-muted rounded animate-pulse w-20" />
                  </div>
                ))}
              </div>
            ) : selectedWorkouts.length > 0 ? (
              <div className="space-y-2">
                {selectedWorkouts.map((w) => {
                  const totalSets = w.exercises.reduce((s, e) => s + e.sets.length, 0);
                  const volume = Math.round(w.exercises.reduce((s, e) => s + calcVolume(e.sets), 0));
                  const cats = [...new Set(w.exercises.map((e) => CATEGORY_LABELS[e.exerciseCategorySnapshot]))];
                  const catLabel = cats.slice(0, 2).join(' + ') + (cats.length > 2 ? ` +${cats.length - 2}` : '');
                  return (
                    <div key={w.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
                      <div>
                        <p className="font-medium text-sm">{catLabel || 'Тренировка'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {w.durationSeconds ? `${formatDuration(w.durationSeconds)} · ` : ''}
                          {totalSets} подходов · {volume.toLocaleString('ru')} кг
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        {w.exercises.map((ex) => {
                          const maxW = ex.sets.reduce((m, s) => Math.max(m, s.weight), 0);
                          return (
                            <div key={ex.id} className="flex items-center justify-between">
                              <span className="text-sm text-foreground/80">{ex.exerciseNameSnapshot}</span>
                              <span className="text-xs text-muted-foreground tabular-nums">
                                {ex.sets.length} × {maxW} кг
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-4">Нет данных</p>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
