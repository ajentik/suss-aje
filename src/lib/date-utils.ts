import type { DateRangePreset } from "@/types";

const MONTH_DAY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const MONTH_DAY_YEAR_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

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

function parseIsoDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00`);
}

export function formatEventDate(isoDate: string): string {
  const date = parseIsoDate(isoDate);
  const currentYear = new Date().getFullYear();
  if (date.getFullYear() === currentYear) {
    return MONTH_DAY_FORMATTER.format(date);
  }
  return MONTH_DAY_YEAR_FORMATTER.format(date);
}

export function formatEventDateRange(startDate: string, endDate?: string): string {
  if (!endDate || endDate === startDate) {
    return formatEventDate(startDate);
  }

  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);

  if (start.getFullYear() !== end.getFullYear()) {
    return `${MONTH_DAY_YEAR_FORMATTER.format(start)} – ${MONTH_DAY_YEAR_FORMATTER.format(end)}`;
  }

  if (start.getMonth() === end.getMonth()) {
    const startText = MONTH_DAY_FORMATTER.format(start);
    return `${startText} – ${end.getDate()}`;
  }

  return `${MONTH_DAY_FORMATTER.format(start)} – ${MONTH_DAY_FORMATTER.format(end)}`;
}
