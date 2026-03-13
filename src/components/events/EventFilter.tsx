"use client";

import type { DateRangePreset } from "@/types";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
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
  const hasActiveFilters = dateFilter !== "all" || categoryFilter !== "" || schoolFilter !== "";

  return (
    <div className="flex flex-col gap-2 p-3 border-b">
      {/* Date segmented control */}
      <div className="flex w-full rounded-lg bg-muted p-[3px]">
        {DATE_PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => onDateChange(p.value)}
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors min-h-[44px]",
              dateFilter === p.value
                ? "bg-background text-foreground shadow-sm"
                : "text-foreground/60 hover:text-foreground active:text-foreground"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Category & School dropdowns */}
      <div className="flex gap-2 w-full">
        <Select value={categoryFilter} onValueChange={(value) => onCategoryChange(value ?? "")}>
          <SelectTrigger className={cn(
            "text-sm h-11 rounded-lg bg-background px-3 flex-1 min-w-0",
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
            "text-sm h-11 rounded-lg bg-background px-3 w-[120px] shrink-0",
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

      {/* Clear all filters */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => {
            onDateChange("all");
            onCategoryChange("");
            onSchoolChange("");
          }}
          className="flex items-center gap-1 self-start text-xs text-primary hover:text-primary/80 font-medium transition-colors min-h-[32px]"
        >
          <X className="w-3 h-3" />
          Clear all filters
        </button>
      )}
    </div>
  );
}
