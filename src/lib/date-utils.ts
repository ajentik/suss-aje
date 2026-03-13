import type { DateRangePreset } from "@/types";

export function getDateRange(preset: DateRangePreset): { start: string; end: string } | null {
  if (preset === "all") return null;

  const today = new Date();
  const start = formatISO(today);

  const daysMap: Record<Exclude<DateRangePreset, "all">, number> = {
    "1d": 0,
    "3d": 2,
    "7d": 6,
  };

  const end = new Date(today);
  end.setDate(end.getDate() + daysMap[preset]);
  return { start, end: formatISO(end) };
}

function formatISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
