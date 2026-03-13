"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY] = useState(0);
  const dragStart = useRef(0);

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

  // Swipe-down to dismiss
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStart.current = e.touches[0].clientY;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - dragStart.current;
    if (delta > 0) setDragY(delta);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    if (dragY > 120) {
      handleDismiss();
    }
    setDragY(0);
  }, [dragY, handleDismiss]);

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
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      className="fixed inset-0 z-[45] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to AskSUSSi"
      onKeyDown={(e) => {
        if (e.key === "Escape") handleDismiss();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleDismiss();
      }}
    >
      <div
        ref={dialogRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: isDragging ? "none" : "transform 0.3s ease-out",
          opacity: dragY > 80 ? 1 - (dragY - 80) / 120 : 1,
        }}
        className="relative w-full sm:max-w-md max-h-[92dvh] bg-background rounded-t-3xl sm:rounded-2xl shadow-2xl border border-border overflow-y-auto animate-hero-fade-in-up"
      >
        {/* Swipe handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden sticky top-0 z-20 bg-background">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
        </div>

        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-surface-brand to-surface-brand-hover px-6 py-5 text-surface-brand-foreground relative overflow-hidden sticky top-0 sm:top-0 z-10">
          {/* Subtle radial glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.08)_0%,transparent_50%)] pointer-events-none" />
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Close welcome dialog"
            className="absolute top-4 right-4 flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-sm transition-colors text-white/80 hover:text-white min-w-[44px] min-h-[44px]"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-3 mb-3 relative">
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
          <h2 className="text-xl font-bold relative">Welcome to your campus assistant</h2>
          <p className="text-sm opacity-80 mt-1.5 leading-relaxed relative">
            I can help you navigate, find events, and discover what&apos;s around SUSS.
          </p>
        </div>

        {/* Capabilities — single-column scrollable list on mobile, 2-col on wider */}
        <div className="px-5 py-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            What I can do
          </p>
          <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2">
            {CAPABILITIES.map(({ icon: Icon, label, description }, i) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 p-3 animate-hero-fade-in-up"
                style={{ animationDelay: `${200 + i * 60}ms` }}
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-primary" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground leading-snug">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Try suggestions — larger touch targets with staggered entrance */}
        <div className="px-5 pb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
            Try asking...
          </p>
          <div className="flex flex-wrap gap-2">
            {TRY_SUGGESTIONS.map((text, i) => (
              <button
                key={text}
                type="button"
                onClick={() => handleTrySuggestion(text)}
                className="text-sm px-4 py-2.5 rounded-full border border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground active:bg-primary/90 transition-all duration-200 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px] animate-hero-fade-in"
                style={{ animationDelay: `${600 + i * 80}ms` }}
              >
                {text}
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="px-5 pb-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-1">
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full bg-primary text-primary-foreground rounded-xl px-4 py-3.5 text-[0.938rem] font-bold hover:bg-primary/90 active:bg-primary/80 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[48px] shadow-sm"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
