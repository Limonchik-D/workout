'use client';

import { useState } from 'react';
import { BarChart2, TrendingUp } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { useStatistics, useExerciseChartData } from '@/hooks/use-statistics';
import { formatDuration } from '@/lib/calculations';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatisticsPageSkeleton } from '@/components/ui/page-skeletons';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import type { StatPeriod, ChartMetric, ExerciseStats } from '@/types/domain';
import { cn } from '@/lib/utils';

const PERIODS: { value: StatPeriod; label: string }[] = [
  { value: '7d', label: '7 дн' },
  { value: '1m', label: '1 мес' },
  { value: '3m', label: '3 мес' },
  { value: '6m', label: '6 мес' },
  { value: '1y', label: '1 год' },
  { value: 'all', label: 'Всё' },
];

const CHART_COLORS = [
  '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444',
];

export default function StatisticsPage() {
  const [period, setPeriod] = useState<StatPeriod>('3m');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseStats | null>(null);
  const [chartMetric, setChartMetric] = useState<ChartMetric>('weight');

  const { isLoading, periodStats, exerciseStatsList, categoryChartData } = useStatistics(period);

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto w-full px-4 py-5 space-y-5">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Статистика</h1>
        </div>

        {/* Period filter */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shrink-0',
                period === p.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary/70'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <StatisticsPageSkeleton />
        ) : periodStats?.workoutCount === 0 ? (
          <EmptyStats />
        ) : (
          <>
            {/* Overview stats */}
            {periodStats && (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Тренировок', value: String(periodStats.workoutCount) },
                  { label: 'Подходов', value: String(periodStats.totalSets) },
                  { label: 'Объём', value: `${Math.round(periodStats.totalVolume).toLocaleString('ru')} кг` },
                  { label: 'Время', value: formatDuration(periodStats.totalDurationSeconds) },
                ].map((s, i) => (
                  <div
                    key={s.label}
                    className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                    style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
                  >
                    <StatCard label={s.label} value={s.value} />
                  </div>
                ))}
              </div>
            )}

            {/* Category donut */}
            {categoryChartData.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-4">
                <h3 className="text-sm font-semibold mb-1">Распределение нагрузки по категориям</h3>
                <p className="text-xs text-muted-foreground mb-3">по объёму (кг × повт.)</p>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryChartData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(v) => [`${v} кг`, '']}
                    />
                    <Legend
                      formatter={(value) => <span style={{ fontSize: 12, color: 'hsl(var(--foreground))' }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Exercise list */}
            {exerciseStatsList.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold px-1">Упражнения</h3>
                {exerciseStatsList
                  .sort((a, b) => b.totalVolume - a.totalVolume)
                  .map((ex, i) => (
                    <div
                      key={ex.exerciseId}
                      className="animate-in fade-in duration-300"
                      style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}
                    >
                      <button
                      className={cn(
                        'w-full bg-card border border-border rounded-xl px-4 py-3 text-left transition-colors hover:bg-secondary/30',
                        selectedExercise?.exerciseId === ex.exerciseId && 'border-primary/40 bg-primary/5'
                      )}
                      onClick={() =>
                        setSelectedExercise(selectedExercise?.exerciseId === ex.exerciseId ? null : ex)
                      }
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{ex.exerciseName}</span>
                        <span className="text-xs text-muted-foreground">{ex.sessionCount} сессий</span>
                      </div>
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                        <span>Макс: {ex.maxWeight} кг</span>
                        <span>Объём: {Math.round(ex.totalVolume).toLocaleString('ru')} кг</span>
                      </div>
                    </button>
                    </div>
                  ))}
              </div>
            )}

            {/* Exercise detail chart */}
            {selectedExercise && (
              <ExerciseChart
                exercise={selectedExercise}
                period={period}
                metric={chartMetric}
                onMetricChange={setChartMetric}
              />
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3 text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function EmptyStats() {
  return (
    <div className="text-center py-16 text-muted-foreground">
      <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-30" />
      <p className="font-medium">Нет данных за период</p>
      <p className="text-sm mt-1">Завершите несколько тренировок, чтобы увидеть статистику</p>
    </div>
  );
}

function ExerciseChart({
  exercise,
  period,
  metric,
  onMetricChange,
}: {
  exercise: ExerciseStats;
  period: StatPeriod;
  metric: ChartMetric;
  onMetricChange: (m: ChartMetric) => void;
}) {
  const data = useExerciseChartData(exercise.exerciseId, metric, period);

  const metricLabel: Record<ChartMetric, string> = {
    weight: 'Вес, кг',
    reps: 'Повторения',
    volume: 'Объём, кг',
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold text-sm">{exercise.exerciseName}</h3>
        <Tabs value={metric} onValueChange={(v) => onMetricChange(v as ChartMetric)}>
          <TabsList className="h-7">
            <TabsTrigger value="weight" className="text-xs px-2 h-6">Вес</TabsTrigger>
            <TabsTrigger value="reps" className="text-xs px-2 h-6">Повт.</TabsTrigger>
            <TabsTrigger value="volume" className="text-xs px-2 h-6">Объём</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {data.length < 2 ? (
        <p className="text-xs text-muted-foreground text-center py-8">
          Недостаточно данных для графика
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <XAxis
              dataKey="date"
              tickFormatter={(d: string) => d.slice(5)}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelFormatter={(d) =>
                typeof d === 'string' ? new Date(d + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : String(d)
              }
              formatter={(v) => [v, metricLabel[metric]]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ r: 3, fill: '#8b5cf6', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/40">
        <MiniStat label="Макс. вес" value={`${exercise.maxWeight} кг`} />
        <MiniStat label="Макс. повт." value={String(exercise.maxReps)} />
        <MiniStat label="Подходов" value={String(exercise.totalSets)} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-sm font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
