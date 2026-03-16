"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar } from "lucide-react";
import type { POI, CampusEvent } from "@/types";
import { useAppStore } from "@/store/app-store";
import {
  getAACEventsForPOI,
  type AACEventKind,
  type AACEventsByKind,
} from "@/lib/maps/aac-events";
import EventRow from "@/components/ui/EventRow";

interface AACEventsSectionProps {
  poi: POI;
  precomputedEvents?: AACEventsByKind;
}

const TAB_LABELS: Record<AACEventKind, string> = {
  regular: "Regular",
  special: "Special",
};

export default function AACEventsSection({ poi, precomputedEvents }: AACEventsSectionProps) {
  const setSelectedEvent = useAppStore((s) => s.setSelectedEvent);
  const setFlyToTarget = useAppStore((s) => s.setFlyToTarget);
  const [activeTab, setActiveTab] = useState<AACEventKind>("regular");
  const [eventsByKind, setEventsByKind] = useState<AACEventsByKind | null>(
    precomputedEvents ?? null,
  );

  useEffect(() => {
    if (precomputedEvents) {
      setEventsByKind(precomputedEvents);
      return;
    }

    let cancelled = false;
    getAACEventsForPOI(poi.name).then((result) => {
      if (!cancelled) setEventsByKind(result);
    });
    return () => {
      cancelled = true;
    };
  }, [precomputedEvents, poi.name]);

  const handleEventClick = useCallback(
    (event: CampusEvent) => {
      setFlyToTarget({ lat: event.lat, lng: event.lng });
      setSelectedEvent(event);
    },
    [setFlyToTarget, setSelectedEvent],
  );

  if (!eventsByKind) return null;

  const totalCount =
    eventsByKind.regular.length + eventsByKind.special.length;

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

      <div
        key={activeTab}
        className="animate-aac-tab-fade-in space-y-1.5 max-h-[200px] overflow-y-auto overscroll-contain"
        style={{
          maskImage: "linear-gradient(to bottom, transparent 0, black 8px, black calc(100% - 12px), transparent 100%)",
        }}
      >
        {activeEvents.length === 0 ? (
          <p className="text-xs text-muted-foreground/60 text-center py-4">
            No {TAB_LABELS[activeTab].toLowerCase()} events scheduled
          </p>
        ) : (
          activeEvents.map((evt) => (
            <EventRow
              key={evt.id}
              event={evt}
              poiLat={poi.lat}
              poiLng={poi.lng}
              onEventClick={handleEventClick}
            />
          ))
        )}
      </div>
    </div>
  );
}
