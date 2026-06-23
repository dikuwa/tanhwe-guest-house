import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("skeleton", className)}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xs">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-40" />
        <div className="flex gap-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="mt-3 h-9 w-full" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xs">
      <div className="border-b border-neutral-100 bg-neutral-50 px-4 py-3">
        <div className="flex gap-8">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-8 border-b border-neutral-100 px-4 py-4 last:border-0"
        >
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function MetricSkeleton() {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="size-4 rounded" />
      </div>
      <Skeleton className="mt-3 h-7 w-16" />
    </div>
  );
}

export { Skeleton };
