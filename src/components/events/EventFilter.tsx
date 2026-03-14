"use client";

import type { DateRangePreset } from "@/types";
import { cn } from "@/lib/utils";
import { X, SlidersHorizontal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DATE_PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: "1d", label: "Today" },
  { value: "3d", label: "3 Days" },
  { value: "7d", label: "This Week" },
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
  const activeCount =
    (dateFilter !== "all" ? 1 : 0) +
    (categoryFilter !== "" ? 1 : 0) +
    (schoolFilter !== "" ? 1 : 0);

  return (
    <div role="search" aria-label="Event filters" className="flex flex-col gap-2.5 px-4 py-3 border-b border-border/60 bg-background/80 backdrop-blur-sm">
      {/* Section header with filter count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground/70" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filters</span>
          {activeCount > 0 && (
             <span aria-live="polite" className="animate-hero-fade-in flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[0.625rem] font-bold">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            type="button"
            aria-label="Clear all filters"
            onClick={() => {
              onDateChange("all");
              onCategoryChange("");
              onSchoolChange("");
            }}
            className="animate-hero-fade-in flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors min-h-[44px] px-2"
          >
            <X className="w-3 h-3" />
            Clear all
          </button>
        )}
      </div>

      {/* Date segmented control */}
      <div role="group" aria-label="Date range" className="flex w-full rounded-xl bg-muted/70 p-1">
        {DATE_PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            aria-pressed={dateFilter === p.value}
            onClick={() => onDateChange(p.value)}
            className={cn(
              "flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 min-h-[44px]",
              dateFilter === p.value
                ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                : "text-muted-foreground hover:text-foreground active:bg-background/50"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Category & School — full-width stacked on narrow screens */}
      <div className="flex flex-col min-[400px]:flex-row gap-2 w-full">
        <Select value={categoryFilter} onValueChange={(value) => onCategoryChange(value ?? "")}>
          <SelectTrigger className={cn(
            "text-sm h-12 rounded-xl bg-background px-3.5 flex-1 min-w-0 transition-all duration-200",
            categoryFilter && "ring-2 ring-primary/30 border-primary/40"
          )}>
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={schoolFilter} onValueChange={(value) => onSchoolChange(value ?? "")}>
          <SelectTrigger className={cn(
            "text-sm h-12 rounded-xl bg-background px-3.5 min-[400px]:w-[130px] shrink-0 transition-all duration-200",
            schoolFilter && "ring-2 ring-primary/30 border-primary/40"
          )}>
            <SelectValue placeholder="All schools" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All schools</SelectItem>
            <SelectItem value="SUSS">SUSS</SelectItem>
            <SelectItem value="SIM">SIM</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
