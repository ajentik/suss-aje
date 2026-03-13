"use client";

import { useState, useEffect, useMemo } from "react";
import type { CampusEvent, DateRangePreset } from "@/types";
import { getDateRange } from "@/lib/date-utils";

export function useCampusEvents() {
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [dateFilter, setDateFilter] = useState<DateRangePreset>("7d");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/campus-events.json")
      .then((res) => res.json())
      .then((data) => {
        setEvents(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
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
    dateFilter,
    setDateFilter,
    categoryFilter,
    setCategoryFilter,
    schoolFilter,
    setSchoolFilter,
  };
}
