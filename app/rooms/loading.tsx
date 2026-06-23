import { CardSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function RoomsLoading() {
  return (
    <div className="min-h-screen">
      <div className="bg-neutral-50 px-4 py-16 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-[1180px]">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-12 w-64 sm:h-14 sm:w-80" />
          <Skeleton className="mt-4 h-5 w-96" />
        </div>
      </div>
      <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6">
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
      <div className="mx-auto max-w-[1180px] px-4 pb-24 pt-8 sm:px-6 lg:pb-32">
        <div className="flex items-end justify-between gap-4">
          <div>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="mt-2 h-4 w-64" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
