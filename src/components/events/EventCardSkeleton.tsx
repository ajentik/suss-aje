interface EventCardSkeletonProps {
  index?: number;
}

export function EventCardSkeleton({ index = 0 }: EventCardSkeletonProps) {
  return (
    <div
      className="p-5 rounded-2xl border border-l-4 border-l-muted flex flex-col gap-3"
      style={{
        animationDelay: `${index * 100}ms`,
      }}
    >
      {/* Header: logo + title + type dot */}
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl skeleton-shimmer" />
        <div className="flex-1 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="h-[1.125rem] w-3/4 rounded-md skeleton-shimmer" />
            <div className="w-2 h-2 rounded-full skeleton-shimmer mt-1" />
          </div>
          {/* Date row */}
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded skeleton-shimmer" />
            <div className="h-3.5 w-24 rounded skeleton-shimmer" />
            <div className="h-3.5 w-14 rounded skeleton-shimmer" />
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="flex items-center gap-2">
        <div className="w-3.5 h-3.5 rounded skeleton-shimmer shrink-0" />
        <div className="h-3.5 w-3/5 rounded skeleton-shimmer" />
      </div>

      {/* Tags */}
      <div className="flex gap-1.5">
        <div className="h-6 w-20 rounded-full skeleton-shimmer" />
        <div className="h-6 w-28 rounded-full skeleton-shimmer" />
        <div className="h-6 w-14 rounded-full skeleton-shimmer" />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <div className="h-3.5 w-full rounded skeleton-shimmer" />
        <div className="h-3.5 w-4/5 rounded skeleton-shimmer" />
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-2.5 mt-0.5">
        <div className="h-11 w-[6.5rem] rounded-full skeleton-shimmer" />
        <div className="h-11 w-[6.5rem] rounded-full skeleton-shimmer" />
      </div>
    </div>
  );
}
