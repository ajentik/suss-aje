import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center min-h-[200px]">
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-muted/60 mb-1 animate-[pulse_3s_ease-in-out_infinite]">
        {icon ?? (
          <Inbox className="h-7 w-7 text-muted-foreground/60" aria-hidden="true" />
        )}
      </div>
      <div className="space-y-1.5">
        <p className="text-base font-semibold text-foreground">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground max-w-[260px] leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
