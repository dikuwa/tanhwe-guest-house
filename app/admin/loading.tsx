import { MetricSkeleton, TableSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-2 h-7 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <MetricSkeleton key={i} />
        ))}
      </div>
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-1 h-3 w-48" />
          </div>
          <Skeleton className="h-7 w-20 rounded-md" />
        </div>
        <TableSkeleton rows={4} />
      </div>
    </div>
  );
}
