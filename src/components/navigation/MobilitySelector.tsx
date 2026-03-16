"use client";

import { useCallback } from "react";
import { useAppStore } from "@/store/app-store";
import type { MobilityLevel } from "@/types";

interface MobilityOption {
  level: MobilityLevel;
  icon: string;
  label: string;
}

const OPTIONS: MobilityOption[] = [
  { level: "normal", icon: "\uD83D\uDEB6", label: "Normal" },
  { level: "slow", icon: "\uD83E\uDDAF", label: "Slow" },
  { level: "walker", icon: "\uD83E\uDDBD", label: "Walker" },
  { level: "wheelchair", icon: "\u267F", label: "Wheelchair" },
];

export default function MobilitySelector() {
  const mobilityLevel = useAppStore((s) => s.mobilityLevel);
  const setMobilityLevel = useAppStore((s) => s.setMobilityLevel);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setMobilityLevel(e.target.value as MobilityLevel);
    },
    [setMobilityLevel],
  );

  return (
    <fieldset
      className="flex items-center gap-1.5"
      aria-label="Mobility level"
    >
      {OPTIONS.map(({ level, icon, label }) => {
        const selected = mobilityLevel === level;
        const id = `mobility-${level}`;
        return (
          <label
            key={level}
            htmlFor={id}
            className={[
              "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 cursor-pointer",
              selected
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted",
            ].join(" ")}
          >
            <input
              id={id}
              type="radio"
              name="mobility-level"
              value={level}
              checked={selected}
              onChange={handleChange}
              className="sr-only"
            />
            <span aria-hidden="true">{icon}</span>
            <span>{label}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
