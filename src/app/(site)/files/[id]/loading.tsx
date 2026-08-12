import { Skeleton } from "@/components/ui/skeleton";

/**
 * Server-streamed placeholder shown while this route segment's data
 * (generateMetadata's getFileInfo call) is still resolving, before
 * FileDetail's own client-side skeleton takes over post-hydration.
 * Intentionally mirrors FileDetail's DetailSkeleton shape so there's no
 * visible layout jump when the real component mounts.
 */
export default function FileLoading() {
  return (
    <div className="mx-auto max-w-xl px-5 pb-24 pt-10 sm:pt-14">
      <Skeleton className="mb-6 h-7 w-16 rounded-md" />
      <div className="animate-fade-up rounded-xl border border-line bg-paper shadow-soft">
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <Skeleton className="h-11 w-11 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-2.5 w-1/3" />
          </div>
        </div>
        <div className="space-y-5 p-5">
          <div className="flex items-center gap-4">
            <Skeleton className="h-24 w-24 shrink-0 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
          <Skeleton className="h-10 w-full rounded-full" />
          <div className="space-y-3 border-y border-line py-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-2.5 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
