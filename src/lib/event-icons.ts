import type { LucideIcon } from "lucide-react";
import {
  Info,
  DoorOpen,
  Presentation,
  Users,
  Briefcase,
  BookOpen,
  MessageSquare,
  Landmark,
  PartyPopper,
  Trophy,
  Calendar,
} from "lucide-react";

export const CATEGORY_ICON: Record<string, LucideIcon> = {
  "Information Session": Info,
  "Open House": DoorOpen,
  "Public Lecture / Enrichment Talk": Presentation,
  Symposium: Users,
  "Competition / Hackathon": Trophy,
  Career: Briefcase,
  "Career Fair": Briefcase,
  Lecture: BookOpen,
  "Forum / Conference": MessageSquare,
  Forum: MessageSquare,
  Conference: Landmark,
  Social: PartyPopper,
};

export const DEFAULT_EVENT_ICON: LucideIcon = Calendar;

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
