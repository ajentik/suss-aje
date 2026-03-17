"use client";

import { type ReactNode, useCallback, useRef, useEffect } from "react";
import { DooIcon } from "@/lib/icons";
import {
  useBottomSheet,
  type SnapName,
  type SnapConfig,
} from "@/hooks/useBottomSheet";

// ── Props ──

interface MobileSheetProps {
  children: ReactNode;
  /** Content shown in the mini (collapsed) state */
  miniContent?: ReactNode;
  /** Snap point overrides */
  snapConfig?: Partial<SnapConfig>;
  /** Called when snap state changes */
  onSnapChange?: (snap: SnapName) => void;
  /** Initial snap point */
  initialSnap?: SnapName;
  /** Additional class names on the outer container */
  className?: string;
  snapToRef?: { current: ((snap: SnapName) => void) | null };
}

// ── Default mini content ──

function DefaultMiniContent() {
  return (
    <div className="flex items-center gap-2.5 px-4 pb-1">
      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 shrink-0">
        <DooIcon name="message" size={14} className="text-primary" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="font-semibold text-card-foreground text-[13px] leading-tight truncate">
          AskSUSSi
        </span>
        <span className="text-[11px] text-muted-foreground/70">
          Swipe up
        </span>
      </div>
    </div>
  );
}

// ── Component ──

export function MobileSheet({
  children,
  miniContent,
  snapConfig,
  onSnapChange,
  initialSnap = "peek",
  className = "",
  snapToRef,
}: MobileSheetProps) {
  const {
    sheetRef,
    handleRef,
    snapState,
    isDragging,
    snapTo,
    touchHandlers,
  } = useBottomSheet(snapConfig);

  // Track snap changes for callback
  const prevSnapRef = useRef<SnapName>(initialSnap);
  useEffect(() => {
    if (snapState !== prevSnapRef.current) {
      prevSnapRef.current = snapState;
      onSnapChange?.(snapState);
    }
  }, [snapState, onSnapChange]);

  useEffect(() => {
    if (!snapToRef) return;
    snapToRef.current = snapTo;
    return () => {
      snapToRef.current = null;
    };
  }, [snapTo, snapToRef]);

  // Snap to initial on mount
  const didInitRef = useRef(false);
  useEffect(() => {
    if (!didInitRef.current) {
      didInitRef.current = true;
      if (initialSnap !== "peek") {
        snapTo(initialSnap);
      }
    }
  }, [initialSnap, snapTo]);

  // Handle tap on drag handle — cycle through snaps
  const handleTap = useCallback(() => {
    const cycle: Record<SnapName, SnapName> = {
      mini: "peek",
      peek: "half",
      half: "full",
      full: "mini",
    };
    snapTo(cycle[snapState]);
  }, [snapState, snapTo]);

  // Handle keyboard accessibility on drag handle
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleTap();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const order: SnapName[] = ["mini", "peek", "half", "full"];
        const idx = order.indexOf(snapState);
        if (idx < order.length - 1) snapTo(order[idx + 1]);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const order: SnapName[] = ["mini", "peek", "half", "full"];
        const idx = order.indexOf(snapState);
        if (idx > 0) snapTo(order[idx - 1]);
      }
    },
    [snapState, snapTo, handleTap],
  );

  // Content scroll coordination: prevent sheet collapse when content is scrolled
  const contentRef = useRef<HTMLDivElement | null>(null);

  const isMini = snapState === "mini";

  return (
    <aside
      ref={sheetRef}
      aria-label="Bottom sheet"
      className={`
        md:hidden fixed bottom-0 left-0 right-0 z-30
        h-[90dvh]
        bg-background/95 backdrop-blur-xl
        rounded-t-2xl
        shadow-[0_-8px_30px_rgba(0,0,0,0.12)]
        border-t border-border/30
        flex flex-col
        will-change-transform
        ${className}
      `}
      style={{
        visibility: "hidden", // hidden until hook positions it
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        // No CSS transition during drag; spring handles animation
        transition: isDragging ? "none" : undefined,
      }}
    >
      {/* ── Drag handle area ── */}
      <div
        ref={handleRef}
        className="flex flex-col items-center pt-2.5 pb-1.5 shrink-0 cursor-grab active:cursor-grabbing select-none w-full"
        style={{ touchAction: "none" }}
        onTouchStart={touchHandlers.onTouchStart}
        onTouchMove={touchHandlers.onTouchMove}
        onTouchEnd={touchHandlers.onTouchEnd}
      >
        <button
          type="button"
          aria-label={
            isMini ? "Expand panel" : "Drag to resize or tap to cycle"
          }
          aria-roledescription="drag handle"
          className="border-0 bg-transparent p-0"
          onClick={handleTap}
          onKeyDown={handleKeyDown}
        >
          {/* Visual pill indicator */}
          <div
            className={`
              w-10 h-1 rounded-full bg-muted-foreground/30
              transition-all duration-200
              ${isDragging ? "w-12 bg-muted-foreground/50" : ""}
            `}
          />
        </button>
      </div>

      {/* ── Mini state content ── */}
      {isMini && (
        <div className="shrink-0">
          {miniContent ?? <DefaultMiniContent />}
        </div>
      )}

      {/* ── Main content area ── */}
      <div
        ref={contentRef}
        className={`
          flex-1 min-h-0 overflow-y-auto overscroll-contain
          ${isMini ? "invisible overflow-hidden" : ""}
        `}
        style={{
          // Prevent iOS bounce from interfering with sheet drag
          WebkitOverflowScrolling: "touch",
        }}
      >
        {children}
      </div>
    </aside>
  );
}

export { useBottomSheet } from "@/hooks/useBottomSheet";
export type { SnapName, SnapConfig } from "@/hooks/useBottomSheet";
