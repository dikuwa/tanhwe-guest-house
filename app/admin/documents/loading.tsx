import { TableSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function DocumentsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-1 h-7 w-36" />
        <Skeleton className="mt-1 h-4 w-56" />
      </div>
      <Skeleton className="h-24 w-full rounded-xl" />
      <TableSkeleton rows={5} />
    </div>
  );
}
