"use client";

import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";
import type { LanguageCode } from "@/types";

const LANGUAGES: { code: LanguageCode; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "zh", label: "中文" },
  { code: "ms", label: "BM" },
  { code: "ta", label: "தமிழ்" },
];

export default function LanguageToggle() {
  const preferredLanguage = useAppStore((s) => s.preferredLanguage);
  const setPreferredLanguage = useAppStore((s) => s.setPreferredLanguage);

  return (
    <fieldset
      aria-label="Preferred language"
      className="flex items-center gap-1 border-0 p-0 m-0"
    >
      {LANGUAGES.map(({ code, label }) => {
        const isActive = preferredLanguage === code;
        return (
          <label
            key={code}
            className={cn(
              "relative flex items-center justify-center",
              "h-14 min-w-14 px-3 rounded-lg text-sm font-semibold cursor-pointer",
              "transition-all duration-200",
              "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
              isActive
                ? "bg-white/25 border-2 border-white text-white"
                : "bg-white/5 border border-white/20 text-white/70 hover:bg-white/15 hover:text-white"
            )}
          >
            <input
              type="radio"
              name="preferred-language"
              value={code}
              checked={isActive}
              onChange={() => setPreferredLanguage(code)}
              className="sr-only"
            />
            {label}
          </label>
        );
      })}
    </fieldset>
  );
}
