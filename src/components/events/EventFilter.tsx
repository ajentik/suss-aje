"use client";

import type { DateRangePreset } from "@/types";
import { cn } from "@/lib/utils";
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
      <Select value={categoryFilter} onValueChange={(value) => onCategoryChange(value ?? "")}>
        <SelectTrigger className="text-xs h-8 rounded-md bg-background px-2 w-[160px]">
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
        <SelectTrigger className="text-xs h-8 rounded-md bg-background px-2 w-[120px]">
          <SelectValue placeholder="All schools" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All schools</SelectItem>
          <SelectItem value="SUSS">SUSS</SelectItem>
          <SelectItem value="SIM">SIM</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
