"use client";

import type { DateRangePreset } from "@/types";
import { cn } from "@/lib/utils";

const DATE_PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: "1d", label: "Today" },
  { value: "3d", label: "3 Days" },
  { value: "7d", label: "7 Days" },
  { value: "all", label: "All" },
];

interface EventFilterProps {
  dateFilter: DateRangePreset;
  onDateChange: (preset: DateRangePreset) => void;
  categoryFilter: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
  schoolFilter: string;
  onSchoolChange: (school: string) => void;
}

export default function EventFilter({
  dateFilter,
  onDateChange,
  categoryFilter,
  onCategoryChange,
  categories,
  schoolFilter,
  onSchoolChange,
}: EventFilterProps) {
  return (
    <div className="flex gap-2 p-3 border-b flex-wrap">
      <div className="flex w-full rounded-lg bg-muted p-[3px]">
        {DATE_PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => onDateChange(p.value)}
            className={cn(
              "flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
              dateFilter === p.value
                ? "bg-background text-foreground shadow-sm"
                : "text-foreground/60 hover:text-foreground"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      <select
        value={categoryFilter}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="text-xs h-8 rounded-md border bg-background px-2"
      >
        <option value="">All categories</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
      <select
        value={schoolFilter}
        onChange={(e) => onSchoolChange(e.target.value)}
        className="text-xs h-8 rounded-md border bg-background px-2"
      >
        <option value="">All schools</option>
        <option value="SUSS">SUSS</option>
        <option value="SIM">SIM</option>
      </select>
    </div>
  );
}
