import { TableSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function UsersLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-1 h-7 w-24" />
        <Skeleton className="mt-1 h-4 w-56" />
      </div>
      <TableSkeleton rows={4} />
    </div>
  );
}
