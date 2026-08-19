import { Skeleton } from '@/components/ui/skeleton';

export function WorkoutPageSkeleton() {
  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      {/* Exercise cards */}
      {[1, 2].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-12 rounded-full ml-1" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((j) => (
              <div key={j} className="flex items-center gap-2">
                <Skeleton className="h-4 w-5" />
                <Skeleton className="h-9 flex-1 rounded-lg" />
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-9 flex-1 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatisticsPageSkeleton() {
  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-5 space-y-5">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-8 w-14 shrink-0 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card border border-border rounded-xl px-4 py-3">
            <Skeleton className="h-8 w-20 mx-auto mb-1" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
        ))}
      </div>
      <div className="bg-card border border-border rounded-2xl p-4">
        <Skeleton className="h-5 w-48 mb-3" />
        <Skeleton className="h-55 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function CalendarPageSkeleton() {
  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-5 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <Skeleton className="h-6 w-40" />
        <div className="flex gap-1">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
      <Skeleton className="h-80 w-full rounded-2xl" />
    </div>
  );
}
