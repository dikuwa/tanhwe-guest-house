import { TableSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function RoomsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-1 h-7 w-24" />
          <Skeleton className="mt-1 h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <TableSkeleton rows={6} />
    </div>
  );
}
