"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, MapPin, Calendar, Heart, ShieldCheck, Users, MessageCircle } from "lucide-react";
import { useAppStore } from "@/store/app-store";

const CAPABILITIES = [
  { icon: Heart, label: "Senior care centres", description: "Find 122+ Active Ageing Centres nearby" },
  { icon: ShieldCheck, label: "Emergency SOS", description: "One-tap emergency call & location sharing" },
  { icon: Users, label: "Caregiver support", description: "AIC grants, respite care & resources" },
  { icon: MapPin, label: "Navigate anywhere", description: "3D walking directions with rest stops" },
  { icon: Calendar, label: "Events & activities", description: "Campus events & senior programmes" },
  { icon: MessageCircle, label: "Ask anything", description: "Campus, eldercare, community services" },
] as const;

const TRY_SUGGESTIONS = [
  "Find a senior care centre near me",
  "What caregiver support is available?",
  "What events are happening today?",
  "How do I get to the library?",
];

export default function Onboarding() {
  const onboardingDismissed = useAppStore((s) => s.onboardingDismissed);
  const setOnboardingDismissed = useAppStore((s) => s.setOnboardingDismissed);
  const setPendingChatMessage = useAppStore((s) => s.setPendingChatMessage);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [slideOut, setSlideOut] = useState(false);

  const handleDismiss = useCallback(() => {
    setSlideOut(true);
    setTimeout(() => setOnboardingDismissed(true), 350);
  }, [setOnboardingDismissed]);

  const handleTrySuggestion = useCallback(
    (text: string) => {
      setSlideOut(true);
      setTimeout(() => {
        setOnboardingDismissed(true);
        setPendingChatMessage(text);
      }, 350);
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
      className="fixed inset-0 z-[45] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-0 md:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to AskSUSSi — campus and community care assistant"
    >
      <div
        ref={dialogRef}
        className={`relative w-full md:max-w-md bg-background rounded-t-2xl md:rounded-2xl shadow-2xl border border-border overflow-hidden ${
          slideOut
            ? "translate-y-full md:translate-y-0 md:opacity-0 md:scale-95"
            : "animate-onboarding-slide-up"
        } transition-all duration-300 ease-out`}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-2 pb-0 md:hidden">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/25" />
        </div>

        <div className="bg-surface-brand px-6 py-5 text-surface-brand-foreground">
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Close welcome dialog"
            className="absolute top-4 right-4 flex items-center justify-center w-11 h-11 md:w-8 md:h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200 text-white/80 hover:text-white active:scale-95"
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
            <span className="text-sm font-bold tracking-wider opacity-90">AskSUSSi</span>
          </div>
          <h2 className="text-lg font-bold">Your campus &amp; community care companion</h2>
          <p className="text-sm opacity-80 mt-1">
            Navigate campus, find senior care services, and keep your loved ones safe — all in one place.
          </p>
        </div>

        <div className="px-6 py-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            What I can do
          </p>
          <div className="grid grid-cols-2 gap-2">
            {CAPABILITIES.map(({ icon: Icon, label, description }, i) => (
              <div
                key={label}
                className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-muted/40 p-2.5 animate-onboarding-stagger-in"
                style={{ animationDelay: `${100 + i * 50}ms` }}
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

        <div className="px-6 pb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Try asking...
          </p>
          <div className="flex flex-wrap gap-2">
            {TRY_SUGGESTIONS.map((text, i) => (
              <button
                key={text}
                type="button"
                onClick={() => handleTrySuggestion(text)}
                className="text-sm px-3.5 min-h-[44px] rounded-full border border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-colors duration-200 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95 animate-chip-shimmer"
                style={{ animationDelay: `${400 + i * 80}ms` }}
              >
                {text}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 pb-5 pb-safe">
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full bg-primary text-primary-foreground rounded-full px-4 min-h-[48px] text-sm font-semibold hover:bg-primary/90 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
