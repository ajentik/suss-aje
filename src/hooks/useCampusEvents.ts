"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { toast } from "sonner";
import type { CampusEvent, DateRangePreset } from "@/types";
import { getDateRange } from "@/lib/date-utils";

function loadEvents(
  signal: AbortSignal,
  setEvents: (events: CampusEvent[]) => void,
  setIsLoading: (loading: boolean) => void,
) {
  setIsLoading(true);
  fetch("/campus-events.json", { signal })
    .then((res) => res.json())
    .then((data: CampusEvent[]) => {
      setEvents(data);
      setIsLoading(false);
    })
    .catch((err: unknown) => {
      if (err instanceof DOMException && err.name === "AbortError") return;
      toast.error("Failed to load campus events.");
      setIsLoading(false);
    });
}

export function useCampusEvents() {
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [dateFilter, setDateFilter] = useState<DateRangePreset>("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    controllerRef.current = controller;
    loadEvents(controller.signal, setEvents, setIsLoading);
    return () => controller.abort();
  }, []);

  const refetch = useCallback(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    loadEvents(controller.signal, setEvents, setIsLoading);
  }, []);

  const filteredEvents = useMemo(() => {
    let result = events;

    const range = getDateRange(dateFilter);
    if (range) {
      result = result.filter((e) => {
        const eventEnd = e.endDate || e.date;
        return eventEnd >= range.start && e.date <= range.end;
      });
    }

    if (categoryFilter) {
      const cat = categoryFilter.toLowerCase();
      result = result.filter((e) => e.category.toLowerCase().includes(cat));
    }
    if (schoolFilter) {
      result = result.filter((e) => e.school === schoolFilter);
    }
    return result.sort(
      (a, b) =>
        new Date(`${a.date}T${a.time}`).getTime() -
        new Date(`${b.date}T${b.time}`).getTime()
    );
  }, [events, dateFilter, categoryFilter, schoolFilter]);

  const categories = useMemo(
    () => [...new Set(events.map((e) => e.category))].sort(),
    [events]
  );

  return {
    events: filteredEvents,
    allEvents: events,
    categories,
    isLoading,
    refetch,
    dateFilter,
    setDateFilter,
    categoryFilter,
    setCategoryFilter,
    schoolFilter,
    setSchoolFilter,
  };
}
