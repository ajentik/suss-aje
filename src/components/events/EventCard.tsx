"use client";

import type { CampusEvent } from "@/types";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/app-store";

interface EventCardProps {
  event: CampusEvent;
}

const TYPE_COLORS: Record<string, string> = {
  "On-Campus": "bg-green-100 text-green-800",
  Online: "bg-blue-100 text-blue-800",
  External: "bg-orange-100 text-orange-800",
};

export default function EventCard({ event }: EventCardProps) {
  const setFlyToTarget = useAppStore((s) => s.setFlyToTarget);

  const handleClick = () => {
    setFlyToTarget({ lat: event.lat, lng: event.lng });
  };

  const dateDisplay = event.endDate
    ? `${event.date} – ${event.endDate}`
    : event.date;

  return (
    <button
      onClick={handleClick}
      className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="font-medium text-sm leading-tight">{event.title}</h3>
        <Badge variant="secondary" className="text-[10px] shrink-0">
          {event.category}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground mb-1">{event.description}</p>
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
        <span>{dateDisplay}</span>
        <span>·</span>
        <span>{event.time}</span>
        <span>·</span>
        <span className="truncate max-w-[150px]">{event.location}</span>
      </div>
      <div className="flex items-center gap-2 mt-1.5">
        {event.type && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${TYPE_COLORS[event.type] || ""}`}>
            {event.type}
          </span>
        )}
        {event.school && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted font-medium">
            {event.school}
          </span>
        )}
        {event.url && (
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[10px] text-[#003B5C] hover:underline ml-auto"
          >
            Details →
          </a>
        )}
      </div>
    </button>
  );
}
