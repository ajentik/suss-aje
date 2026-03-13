import { cn } from "@/lib/utils";

function ShimmerBar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[20px] bg-muted/60 animate-skeleton-wave",
        className
      )}
    />
  );
}

export function ChatSkeleton() {
  return (
    <div className="space-y-4 p-4" aria-label="Loading conversation" role="status">
      <div className="flex justify-start">
        <ShimmerBar className="h-12 w-3/5 rounded-bl-[6px]" />
      </div>
      <div className="flex justify-end">
        <ShimmerBar className="h-10 w-2/5 rounded-br-[6px]" />
      </div>
      <div className="flex justify-start">
        <ShimmerBar className="h-16 w-4/5 rounded-bl-[6px]" />
      </div>
      <span className="sr-only">Loading messages...</span>
    </div>
  );
}
