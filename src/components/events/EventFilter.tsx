"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
