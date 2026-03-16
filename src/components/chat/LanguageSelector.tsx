"use client";

import { Languages } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import type { SttLanguage } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STT_OPTIONS: { value: SttLanguage; label: string }[] = [
  { value: "english", label: "English" },
  { value: "singlish", label: "Singlish" },
  { value: "mandarin-mix", label: "中英 Mix" },
];

export default function LanguageSelector() {
  const sttLanguage = useAppStore((s) => s.sttLanguage);
  const setSttLanguage = useAppStore((s) => s.setSttLanguage);

  return (
    <Select
      value={sttLanguage}
      onValueChange={(v) => setSttLanguage(v as SttLanguage)}
    >
      <SelectTrigger
        size="sm"
        className="h-8 gap-1 rounded-full border-border/40 bg-secondary/50 px-2 text-xs text-muted-foreground hover:bg-secondary"
        aria-label="Speech language"
      >
        <Languages size={14} className="shrink-0" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent side="top" sideOffset={8} alignItemWithTrigger={false}>
        {STT_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
