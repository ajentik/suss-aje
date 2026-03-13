"use client";

import { useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarX } from "lucide-react";
import { useCampusEvents } from "@/hooks/useCampusEvents";
import { useAppStore } from "@/store/app-store";
import type { DateRangePreset } from "@/types";
import EventCard from "./EventCard";
import { EventCardSkeleton } from "./EventCardSkeleton";
import EventFilter from "./EventFilter";

export default function EventsPanel() {
  const {
    events,
    categories,
    isLoading,
    dateFilter,
    setDateFilter,
    categoryFilter,
    setCategoryFilter,
    schoolFilter,
    setSchoolFilter,
  } = useCampusEvents();

  const storeDate = useAppStore((s) => s.eventDateFilter);
  const storeCategory = useAppStore((s) => s.eventCategoryFilter);
  const setMapEventMarkers = useAppStore((s) => s.setMapEventMarkers);

  useEffect(() => {
    if (storeDate) setDateFilter(storeDate);
  }, [storeDate, setDateFilter]);

  useEffect(() => {
    if (storeCategory) setCategoryFilter(storeCategory);
  }, [storeCategory, setCategoryFilter]);

  useEffect(() => {
    setMapEventMarkers(events);
  }, [events, setMapEventMarkers]);

  return (
    <div className="flex flex-col h-full">
      <EventFilter
        dateFilter={dateFilter}
        onDateChange={(preset: DateRangePreset) => setDateFilter(preset)}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        categories={categories}
        schoolFilter={schoolFilter}
        onSchoolChange={setSchoolFilter}
      />
      <ScrollArea className="flex-1 p-3">
        {isLoading ? (
          <div className="space-y-3">
            <EventCardSkeleton />
            <EventCardSkeleton />
            <EventCardSkeleton />
            <EventCardSkeleton />
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            icon={<CalendarX className="h-10 w-10 text-muted-foreground/60" />}
            title="No events found"
            description="Try changing your date range or clearing filters to see more events."
            action={
              <button
                type="button"
                onClick={() => {
                  setDateFilter("all");
                  setCategoryFilter("");
                  setSchoolFilter("");
                }}
                className="mt-2 text-sm text-primary hover:underline font-medium min-h-[44px] flex items-center"
              >
                Clear all filters
              </button>
            }
          />
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground px-1 font-medium tracking-wide uppercase">
              {events.length} event{events.length !== 1 ? "s" : ""}
            </p>
            {events.map((event, i) => (
              <EventCard key={event.id} event={event} index={i} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
