import { Skeleton } from "@/components/ui/skeleton";

export default function CustomerDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-1 h-7 w-48" />
      </div>
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-xs">
        <div className="grid gap-5 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-2 h-9 w-full" />
            </div>
          ))}
          <div className="sm:col-span-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-2 h-28 w-full" />
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
