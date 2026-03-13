"use client";

import { CloudOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = "Something went wrong",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center min-h-[200px]">
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-muted/60 mb-1">
        <CloudOff
          className="h-7 w-7 text-muted-foreground/60"
          aria-hidden="true"
        />
      </div>
      <div className="space-y-1.5">
        <p className="text-base font-semibold text-foreground">
          Oops!
        </p>
        <p className="text-sm text-muted-foreground max-w-[260px] leading-relaxed">
          {message}
        </p>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="default"
          onClick={onRetry}
          className="mt-2 min-h-[44px] px-6 rounded-xl font-medium"
        >
          Try again
        </Button>
      )}
    </div>
  );
}
