"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/ui/empty-state";
import { DooIcon } from "@/lib/icons";
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

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    if (storeDate) setDateFilter(storeDate);
  }, [storeDate, setDateFilter]);

  useEffect(() => {
    if (storeCategory) setCategoryFilter(storeCategory);
  }, [storeCategory, setCategoryFilter]);

  useEffect(() => {
    setMapEventMarkers(events);
  }, [events, setMapEventMarkers]);

  useEffect(() => {
    const viewport = scrollRef.current?.querySelector("[data-radix-scroll-area-viewport]");
    if (!viewport) return;
    const handleScroll = () => {
      setShowScrollTop(viewport.scrollTop > 400);
    };
    viewport.addEventListener("scroll", handleScroll, { passive: true });
    return () => viewport.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    const viewport = scrollRef.current?.querySelector("[data-radix-scroll-area-viewport]");
    viewport?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleClearFilters = useCallback(() => {
    setDateFilter("all");
    setCategoryFilter("");
    setSchoolFilter("");
  }, [setDateFilter, setCategoryFilter, setSchoolFilter]);

  return (
    <div className="flex flex-col h-full relative">
      <EventFilter
        dateFilter={dateFilter}
        onDateChange={(preset: DateRangePreset) => setDateFilter(preset)}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        categories={categories}
        schoolFilter={schoolFilter}
        onSchoolChange={setSchoolFilter}
      />
      <ScrollArea ref={scrollRef} className="flex-1 px-4 py-3">
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <EventCardSkeleton key={i} index={i} />
            ))}
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            icon={
              <div className="flex flex-col items-center gap-3 mb-1">
                <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center">
                  <DooIcon name="calendar" size={32} className="text-muted-foreground/50" />
                </div>
              </div>
            }
            title="No events found"
            description="Try adjusting your filters or check back later — new events are added regularly."
            action={
              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-3 text-sm text-primary hover:text-primary/80 font-semibold min-h-[44px] flex items-center gap-1.5 transition-colors px-4 py-2 rounded-full border border-primary/20 hover:bg-primary/5"
              >
                Clear all filters
              </button>
            }
          />
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs text-muted-foreground font-semibold tracking-wide uppercase">
                <span className="tabular-nums">{events.length}</span>
                {" "}event{events.length !== 1 ? "s" : ""}
              </p>
            </div>
            {events.map((event, i) => (
              <EventCard key={event.id} event={event} index={i} />
            ))}
          </div>
        )}
      </ScrollArea>

      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="absolute bottom-4 right-4 z-10 w-11 h-11 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 flex items-center justify-center hover:opacity-90 active:scale-90 transition-all animate-hero-fade-in-up min-w-[44px] min-h-[44px]"
        >
          <DooIcon name="chevron-up" size={20} />
        </button>
      )}
    </div>
  );
}
