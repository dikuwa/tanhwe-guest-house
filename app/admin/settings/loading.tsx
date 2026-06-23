import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-1 h-7 w-28" />
        <Skeleton className="mt-1 h-4 w-64" />
      </div>
      <div className="divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white shadow-xs">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-end gap-3 p-5">
            <div className="flex-1">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="mt-2 h-4 w-20" />
            </div>
            <Skeleton className="h-9 flex-[1.5]" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
