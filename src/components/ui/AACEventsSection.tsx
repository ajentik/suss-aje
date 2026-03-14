"use client";

import { useState, useMemo, useCallback } from "react";
import { Calendar, MapPin, ExternalLink } from "lucide-react";
import type { POI, CampusEvent } from "@/types";
import { useAppStore } from "@/store/app-store";
import {
  getAACEventsForPOI,
  isOffSiteEvent,
  type AACEventKind,
} from "@/lib/maps/aac-events";

interface AACEventsSectionProps {
  poi: POI;
}

const TAB_LABELS: Record<AACEventKind, string> = {
  regular: "Regular",
  special: "Special",
};

function EventRow({
  event,
  poi,
  onEventClick,
}: {
  event: CampusEvent;
  poi: POI;
  onEventClick: (event: CampusEvent) => void;
}) {
  const offSite = isOffSiteEvent(event, poi.lat, poi.lng);

  return (
    <button
      type="button"
      onClick={() => onEventClick(event)}
      className="w-full text-left flex items-start gap-2.5 bg-secondary/50 border border-secondary rounded-lg px-3.5 py-2.5 min-h-[44px] hover:bg-secondary/80 active:bg-secondary transition-colors"
    >
      <span className="text-primary text-xs font-medium shrink-0 mt-0.5 min-w-[68px]">
        {event.date}
      </span>
      <div className="flex-1 min-w-0">
        <span className="text-sm text-card-foreground line-clamp-1">
          {event.title}
        </span>
        <span className="text-xs text-muted-foreground/70 block mt-0.5">
          {event.time}
          {event.endDate && event.endDate !== event.date && (
            <> &mdash; {event.endDate}</>
          )}
        </span>
        {offSite && event.venueAddress && (
          <span className="inline-flex items-center gap-1 text-[0.6875rem] text-amber-600 dark:text-amber-400 mt-1">
            <MapPin size={10} aria-hidden="true" />
            {event.venueAddress}
          </span>
        )}
      </div>
      {event.url && (
        <ExternalLink
          size={12}
          className="shrink-0 mt-1.5 text-muted-foreground/50"
          aria-hidden="true"
        />
      )}
    </button>
  );
}

export default function AACEventsSection({ poi }: AACEventsSectionProps) {
  const setSelectedEvent = useAppStore((s) => s.setSelectedEvent);
  const setFlyToTarget = useAppStore((s) => s.setFlyToTarget);
  const [activeTab, setActiveTab] = useState<AACEventKind>("regular");

  const eventsByKind = useMemo(() => getAACEventsForPOI(poi.name), [poi.name]);

  const totalCount =
    eventsByKind.regular.length + eventsByKind.special.length;

  const handleEventClick = useCallback(
    (event: CampusEvent) => {
      setFlyToTarget({ lat: event.lat, lng: event.lng });
      setSelectedEvent(event);
    },
    [setFlyToTarget, setSelectedEvent],
  );

  if (totalCount === 0) return null;

  const activeEvents = eventsByKind[activeTab];
  const tabs: AACEventKind[] = ["regular", "special"];

  return (
    <div className="border-t border-border pt-3">
      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
        <Calendar size={14} aria-hidden="true" />
        Events ({totalCount})
      </p>

      <div className="flex gap-1 mb-2.5">
        {tabs.map((tab) => {
          const count = eventsByKind[tab].length;
          if (count === 0) return null;
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors min-h-[32px] ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {TAB_LABELS[tab]} ({count})
            </button>
          );
        })}
      </div>

      <div className="space-y-1.5 max-h-[200px] overflow-y-auto overscroll-contain">
        {activeEvents.map((evt) => (
          <EventRow
            key={evt.id}
            event={evt}
            poi={poi}
            onEventClick={handleEventClick}
          />
        ))}
      </div>
    </div>
  );
}
