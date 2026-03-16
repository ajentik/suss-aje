"use client";

import Link from "next/link";
import { DooIcon, type IconName } from "@/lib/icons";

import { cn } from "@/lib/utils";

export type HealthConcern =
  | "mobility issues"
  | "medication concerns"
  | "cognitive decline"
  | "general checkup"
  | "caregiver stress";

interface SuggestionConfig {
  icon: IconName;
  label: string;
  destination: string;
}

export const HEALTH_SUGGESTIONS: Record<HealthConcern, SuggestionConfig> = {
  "mobility issues": {
    icon: "navigation2",
    label: "Find physiotherapy clinic nearby",
    destination: "physiotherapy",
  },
  "medication concerns": {
    icon: "plus",
    label: "Walk to nearest pharmacy",
    destination: "pharmacy",
  },
  "cognitive decline": {
    icon: "bot",
    label: "Find memory clinic nearby",
    destination: "memory-clinic",
  },
  "general checkup": {
    icon: "heart",
    label: "Navigate to nearest polyclinic",
    destination: "polyclinic",
  },
  "caregiver stress": {
    icon: "heart",
    label: "Find caregiver support centre nearby",
    destination: "caregiver-support",
  },
};

export interface HealthNavigationSuggestionsProps {
  concerns: string[];
  className?: string;
}

export default function HealthNavigationSuggestions({
  concerns,
  className,
}: HealthNavigationSuggestionsProps) {
  const matched = concerns.filter(
    (c): c is HealthConcern => c in HEALTH_SUGGESTIONS,
  );

  if (matched.length === 0) return null;

  return (
    <section
      aria-label="Health navigation suggestions"
      className={cn("flex flex-col gap-2", className)}
    >
      <h3 className="text-sm font-semibold text-foreground px-1">
        Suggested nearby places
      </h3>
      <ul className="flex flex-col gap-1.5">
        {matched.map((concern) => {
          const { icon, label, destination } =
            HEALTH_SUGGESTIONS[concern];
          return (
            <li key={concern}>
              <Link
                href={`/navigation?destination=${encodeURIComponent(destination)}`}
                aria-label={`${label} — navigate to ${destination.replace(/-/g, " ")}`}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5",
                  "bg-card ring-1 ring-foreground/10",
                  "hover:bg-accent/50 active:bg-accent",
                  "transition-colors group",
                )}
              >
                <span
                  className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary/10"
                  aria-hidden="true"
                >
                  <DooIcon name={icon} size={16} className="text-primary" />
                </span>
                <span className="flex-1 text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {label}
                </span>
                <span
                  className="flex-shrink-0 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
                  aria-hidden="true"
                >
                  <DooIcon name="navigation" size={12} />
                  Navigate
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
