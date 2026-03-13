"use client";

import { Input } from "@/components/ui/input";

interface EventFilterProps {
  dateFilter: string;
  onDateChange: (date: string) => void;
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
      <Input
        type="date"
        value={dateFilter}
        onChange={(e) => onDateChange(e.target.value)}
        className="text-xs h-8 w-[130px]"
      />
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
