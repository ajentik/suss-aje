"use client";

import { TriangleAlert } from "lucide-react";
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
    <div className="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-destructive/10">
        <TriangleAlert
          className="h-7 w-7 text-destructive"
          aria-hidden="true"
        />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">
          Oops, something broke
        </p>
        <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed">
          {message}
        </p>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-1 min-h-[44px] px-6"
        >
          Try again
        </Button>
      )}
    </div>
  );
}
