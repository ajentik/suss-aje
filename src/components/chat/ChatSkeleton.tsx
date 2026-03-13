import { Skeleton } from "@/components/ui/skeleton";

export function ChatSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-start">
        <Skeleton className="h-10 w-3/5 rounded-2xl rounded-bl-sm" />
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-8 w-2/5 rounded-2xl rounded-br-sm" />
      </div>
      <div className="flex justify-start">
        <Skeleton className="h-14 w-4/5 rounded-2xl rounded-bl-sm" />
      </div>
    </div>
  );
}
