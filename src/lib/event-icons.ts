import type { IconName } from "@/lib/icons";

export const CATEGORY_ICON: Record<string, IconName> = {
  "Information Session": "info",
  "Open House": "shop",
  "Public Lecture / Enrichment Talk": "message2",
  Symposium: "user",
  "Competition / Hackathon": "star",
  Career: "wallet",
  "Career Fair": "wallet",
  Lecture: "doc",
  "Forum / Conference": "message",
  Forum: "message",
  Conference: "globe",
  Social: "sparkle",
};

export const DEFAULT_EVENT_ICON: IconName = "calendar";

export const CATEGORY_ICON_BG: Record<string, string> = {
  "Information Session": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "Open House": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "Public Lecture / Enrichment Talk":
    "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  Symposium: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  "Competition / Hackathon":
    "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  Career: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  "Career Fair": "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  Lecture: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  "Forum / Conference":
    "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  Forum: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  Conference: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  Social: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export const DEFAULT_ICON_BG = "bg-muted text-muted-foreground/60";
