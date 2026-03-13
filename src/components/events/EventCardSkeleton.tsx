export function EventCardSkeleton() {
  return (
    <div className="p-4 rounded-xl border border-l-4 border-l-muted space-y-3">
      {/* Header: logo + title */}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg skeleton-shimmer" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded skeleton-shimmer" />
          <div className="h-3 w-1/2 rounded skeleton-shimmer" />
        </div>
        <div className="w-2.5 h-2.5 rounded-full skeleton-shimmer" />
      </div>

      {/* Location */}
      <div className="h-3 w-2/3 rounded skeleton-shimmer" />

      {/* Tags */}
      <div className="flex gap-1.5">
        <div className="h-5 w-16 rounded-full skeleton-shimmer" />
        <div className="h-5 w-24 rounded-full skeleton-shimmer" />
        <div className="h-5 w-12 rounded-full skeleton-shimmer" />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <div className="h-3 w-full rounded skeleton-shimmer" />
        <div className="h-3 w-4/5 rounded skeleton-shimmer" />
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-2 pt-1">
        <div className="h-11 w-24 rounded-xl skeleton-shimmer" />
        <div className="h-11 w-24 rounded-xl skeleton-shimmer" />
      </div>
    </div>
  );
}
