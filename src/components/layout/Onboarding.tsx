"use client";

import { useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { X, MapPin, Calendar, Utensils, BookOpen, Bus, MessageCircle } from "lucide-react";
import { useAppStore } from "@/store/app-store";

const CAPABILITIES = [
  { icon: MapPin, label: "Navigate campus", description: "Get walking directions to any building" },
  { icon: Calendar, label: "Find events", description: "Discover what\u2019s happening on campus" },
  { icon: Utensils, label: "Food nearby", description: "Find restaurants, hawkers & cafes" },
  { icon: BookOpen, label: "Library info", description: "Check hours, availability & services" },
  { icon: Bus, label: "Transport", description: "Shuttle schedules & nearby transit" },
  { icon: MessageCircle, label: "Ask anything", description: "Campus services, admin & more" },
] as const;

const TRY_SUGGESTIONS = [
  "Where is the library?",
  "What events are today?",
  "Find me a place to eat nearby",
  "How do I get to Block D?",
];

export default function Onboarding() {
  const onboardingDismissed = useAppStore((s) => s.onboardingDismissed);
  const setOnboardingDismissed = useAppStore((s) => s.setOnboardingDismissed);
  const setPendingChatMessage = useAppStore((s) => s.setPendingChatMessage);
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleDismiss = useCallback(() => {
    setOnboardingDismissed(true);
  }, [setOnboardingDismissed]);

  const handleTrySuggestion = useCallback(
    (text: string) => {
      setOnboardingDismissed(true);
      setPendingChatMessage(text);
    },
    [setOnboardingDismissed, setPendingChatMessage]
  );

  useEffect(() => {
    if (onboardingDismissed) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleDismiss();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onboardingDismissed, handleDismiss]);

  useEffect(() => {
    if (onboardingDismissed) return;
    const el = dialogRef.current;
    if (!el) return;

    const focusable = el.querySelectorAll<HTMLElement>(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
    );
    if (focusable.length > 0) focusable[0].focus();
  }, [onboardingDismissed]);

  if (onboardingDismissed) return null;

  return (
    <div
      className="fixed inset-0 z-[45] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to AskSUSSi"
    >
      <div
        ref={dialogRef}
        className="relative w-full max-w-md bg-background rounded-2xl shadow-2xl border border-border overflow-hidden animate-hero-fade-in-up"
      >
        <div className="bg-surface-brand px-6 py-5 text-surface-brand-foreground">
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Close welcome dialog"
            className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white/80 hover:text-white"
          >
            <X size={16} />
          </button>
          <div className="flex items-center gap-3 mb-3">
            <Image
              src="/suss-logo.png"
              alt="SUSS"
              width={80}
              height={28}
              className="h-7 w-auto brightness-0 invert"
              priority
            />
            <div className="h-5 w-px bg-white/25" />
            <span className="text-sm font-bold tracking-wide opacity-90">AskSUSSi</span>
          </div>
          <h2 className="text-lg font-bold">Welcome to your campus assistant</h2>
          <p className="text-sm opacity-80 mt-1">
            I can help you navigate, find events, and discover what&apos;s around SUSS.
          </p>
        </div>

        <div className="px-6 py-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            What I can do
          </p>
          <div className="grid grid-cols-2 gap-2">
            {CAPABILITIES.map(({ icon: Icon, label, description }) => (
              <div
                key={label}
                className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-muted/40 p-2.5"
              >
                <Icon size={16} className="text-primary mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 pb-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Try asking...
          </p>
          <div className="flex flex-wrap gap-2">
            {TRY_SUGGESTIONS.map((text) => (
              <button
                key={text}
                type="button"
                onClick={() => handleTrySuggestion(text)}
                className="text-sm px-3 py-1.5 rounded-full border border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {text}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 pb-5">
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
