import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-live="polite">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56 rounded-full" />
          <Skeleton className="h-3.5 w-72 rounded-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[164px] rounded-[20px]" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Skeleton className="h-[320px] rounded-[20px]" />
        <Skeleton className="h-[320px] rounded-[20px]" />
      </div>
    </div>
  );
}
