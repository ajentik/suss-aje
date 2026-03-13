"use client";

import { useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCampusEvents } from "@/hooks/useCampusEvents";
import { useAppStore } from "@/store/app-store";
import EventCard from "./EventCard";
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

  useEffect(() => {
    if (storeDate) setDateFilter(storeDate);
  }, [storeDate, setDateFilter]);

  useEffect(() => {
    if (storeCategory) setCategoryFilter(storeCategory);
  }, [storeCategory, setCategoryFilter]);

  return (
    <div className="flex flex-col h-full">
      <EventFilter
        dateFilter={dateFilter}
        onDateChange={setDateFilter}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        categories={categories}
        schoolFilter={schoolFilter}
        onSchoolChange={setSchoolFilter}
      />
      <ScrollArea className="flex-1 p-3">
        {isLoading ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            Loading events...
          </p>
        ) : events.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            No events found. Try adjusting your filters.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground px-1">{events.length} events</p>
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
