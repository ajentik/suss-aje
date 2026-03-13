"use client";

import { useState, useEffect, useMemo } from "react";
import type { CampusEvent } from "@/types";

export function useCampusEvents() {
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [dateFilter, setDateFilter] = useState("");
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
    if (dateFilter) {
      result = result.filter(
        (e) => e.date === dateFilter || (e.endDate && e.date <= dateFilter && e.endDate >= dateFilter)
      );
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
