"use client";

import { Volume2, VolumeX, Square, AlertTriangle } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { useVoiceNavigation } from "@/hooks/useVoiceNavigation";

const MANEUVER_ICONS: Record<string, string> = {
  STRAIGHT: "\u2191",
  TURN_LEFT: "\u2190",
  TURN_RIGHT: "\u2192",
  TURN_SLIGHT_LEFT: "\u2196",
  TURN_SLIGHT_RIGHT: "\u2197",
  TURN_SHARP_LEFT: "\u2199",
  TURN_SHARP_RIGHT: "\u2198",
  UTURN_LEFT: "\u21BA",
  UTURN_RIGHT: "\u21BB",
  ROUNDABOUT_LEFT: "\u21BA",
  ROUNDABOUT_RIGHT: "\u21BB",
  DEFAULT: "\u2022",
};

function getManeuverIcon(maneuver?: string): string {
  if (!maneuver) return MANEUVER_ICONS.DEFAULT;
  return MANEUVER_ICONS[maneuver] ?? MANEUVER_ICONS.DEFAULT;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export default function VoiceNavigationBar() {
  const routeInfo = useAppStore((s) => s.routeInfo);
  const nav = useVoiceNavigation();

  if (!nav.isNavigating || !routeInfo) return null;

  const steps = routeInfo.steps;
  const currentStep = steps[nav.currentStepIndex];
  if (!currentStep) return null;

  const isApproaching = nav.distanceToNextMeters <= 50 && nav.distanceToNextMeters > 0;

  return (
    <nav
      aria-label="Voice navigation"
      aria-live="polite"
      className={`
        absolute left-3 right-3 md:left-auto md:right-4 md:w-80 z-20
        animate-control-slide-up
        md:bottom-4
        ${isApproaching ? "animate-nav-pulse" : ""}
      `}
      style={{
        bottom: "calc(var(--sheet-height, 64px) + 16px)",
      }}
    >
      <div
        className={`
          bg-card/90 backdrop-blur-xl border rounded-2xl shadow-lg px-4 py-3
          transition-colors duration-300
          ${nav.isOffRoute
            ? "border-destructive/50 bg-destructive/10"
            : isApproaching
              ? "border-primary/50"
              : "border-border/30"
          }
        `}
      >
        {nav.isOffRoute && (
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-destructive/20">
            <AlertTriangle size={16} className="text-destructive shrink-0" aria-hidden="true" />
            <span className="text-sm font-medium text-destructive">
              Off route — please return to the path
            </span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div
            className={`
              flex items-center justify-center w-10 h-10 rounded-full shrink-0
              text-lg font-medium
              ${isApproaching
                ? "bg-primary/20 text-primary"
                : "bg-muted/60 text-muted-foreground"
              }
            `}
            aria-hidden="true"
          >
            {getManeuverIcon(currentStep.maneuver)}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-lg font-semibold text-card-foreground leading-snug truncate">
              {currentStep.instruction}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm text-muted-foreground tabular-nums">
                {formatDistance(nav.distanceToNextMeters)}
              </span>
              <span className="text-muted-foreground/40">&middot;</span>
              <span className="text-sm text-muted-foreground tabular-nums">
                Step {nav.currentStepIndex + 1}/{steps.length}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/30">
          <button
            type="button"
            onClick={nav.toggleMute}
            aria-label={nav.voiceMuted ? "Unmute voice" : "Mute voice"}
            className={`
              flex items-center justify-center w-11 h-11 rounded-full
              transition-all duration-200 active:scale-90
              ${nav.voiceMuted
                ? "bg-muted/80 text-muted-foreground"
                : "bg-primary/10 text-primary hover:bg-primary/20"
              }
            `}
          >
            {nav.voiceMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          <button
            type="button"
            onClick={nav.stop}
            aria-label="Stop navigation"
            className="flex-1 flex items-center justify-center gap-2 h-11 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 active:scale-[0.98] transition-all duration-200 font-medium text-sm"
          >
            <Square size={14} />
            Stop
          </button>
        </div>
      </div>
    </nav>
  );
}
