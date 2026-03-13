"use client";

import type React from "react";
import { useRef, useState, useCallback, useEffect, useMemo } from "react";

// ── Snap point configuration ──

export interface SnapConfig {
  mini: number;   // 64px — just handle + status
  peek: number;   // 200px — title bar + tabs visible
  half: number;   // 50dvh — comfortable content, map visible
  full: number;   // 90dvh — full content
}

export type SnapName = keyof SnapConfig;

export interface UseBottomSheetReturn {
  sheetRef: React.RefObject<HTMLDivElement | null>;
  handleRef: React.RefObject<HTMLDivElement | null>;
  currentHeight: number;
  snapState: SnapName;
  isDragging: boolean;
  snapTo: (snap: SnapName) => void;
  touchHandlers: {
    onTouchStart: React.TouchEventHandler;
    onTouchMove: React.TouchEventHandler;
    onTouchEnd: React.TouchEventHandler;
  };
}

// ── Physics constants (tuned over 15+ iterations) ──

const SPRING_STIFFNESS = 0.15;
const SPRING_DAMPING = 0.78;
const SETTLE_VELOCITY = 0.3;
const SETTLE_DISTANCE = 0.5;
const FLICK_VELOCITY_THRESHOLD = 500; // px/s
const RUBBER_BAND_FACTOR = 0.22;
const VELOCITY_SAMPLE_COUNT = 8;

// ── Helpers ──

interface TouchSample {
  y: number;
  t: number;
}

function resolveSnapPoints(config: SnapConfig): SnapConfig {
  if (typeof window === "undefined") return config;
  const vh = window.innerHeight;
  return {
    mini: config.mini,
    peek: config.peek,
    half: config.half > 0 ? config.half : Math.round(vh * 0.5),
    full: config.full > 0 ? config.full : Math.round(vh * 0.9),
  };
}

function getOrderedSnaps(config: SnapConfig): { name: SnapName; value: number }[] {
  const entries: { name: SnapName; value: number }[] = [
    { name: "mini", value: config.mini },
    { name: "peek", value: config.peek },
    { name: "half", value: config.half },
    { name: "full", value: config.full },
  ];
  return entries.sort((a, b) => a.value - b.value);
}

function findNearestSnap(
  height: number,
  snaps: { name: SnapName; value: number }[],
): { name: SnapName; value: number } {
  let best = snaps[0];
  let bestDist = Math.abs(height - best.value);
  for (let i = 1; i < snaps.length; i++) {
    const dist = Math.abs(height - snaps[i].value);
    if (dist < bestDist) {
      best = snaps[i];
      bestDist = dist;
    }
  }
  return best;
}

function findAdjacentSnap(
  currentHeight: number,
  direction: "up" | "down",
  snaps: { name: SnapName; value: number }[],
): { name: SnapName; value: number } {
  if (direction === "up") {
    // Find next snap above current height
    for (let i = 0; i < snaps.length; i++) {
      if (snaps[i].value > currentHeight + 2) return snaps[i];
    }
    return snaps[snaps.length - 1];
  }
  // Find next snap below current height
  for (let i = snaps.length - 1; i >= 0; i--) {
    if (snaps[i].value < currentHeight - 2) return snaps[i];
  }
  return snaps[0];
}

function computeVelocity(samples: TouchSample[]): number {
  if (samples.length < 2) return 0;
  const oldest = samples[0];
  const newest = samples[samples.length - 1];
  const dt = (newest.t - oldest.t) / 1000; // seconds
  if (dt === 0) return 0;
  // Positive velocity = moving finger up = increasing height
  return (oldest.y - newest.y) / dt;
}

// ── Default snap config ──

const DEFAULT_SNAPS: SnapConfig = {
  mini: 64,
  peek: 200,
  half: 0,  // resolved at runtime
  full: 0,  // resolved at runtime
};

// ── The Hook ──

export function useBottomSheet(
  config: Partial<SnapConfig> = {},
): UseBottomSheetReturn {
  const { mini, peek, half, full } = config;
  const mergedConfig = useMemo(
    () => ({
      mini: mini ?? DEFAULT_SNAPS.mini,
      peek: peek ?? DEFAULT_SNAPS.peek,
      half: half ?? DEFAULT_SNAPS.half,
      full: full ?? DEFAULT_SNAPS.full,
    }),
    [mini, peek, half, full],
  );
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<HTMLDivElement | null>(null);

  // Resolved snap points (computed once on mount, updated on resize)
  const snapsRef = useRef<SnapConfig>(mergedConfig);
  const orderedSnapsRef = useRef<{ name: SnapName; value: number }[]>([]);

  // Mutable tracking state — NO useState for per-frame values
  const currentHeightRef = useRef(mergedConfig.peek);
  const targetHeightRef = useRef(mergedConfig.peek);
  const velocityRef = useRef(0);
  const animFrameRef = useRef<number>(0);
  const isDraggingRef = useRef(false);
  const dragStartYRef = useRef(0);
  const dragStartHeightRef = useRef(0);
  const touchSamplesRef = useRef<TouchSample[]>([]);

  // React state — only updated at snap boundaries for consumers
  const [snapState, setSnapState] = useState<SnapName>("peek");
  const [isDragging, setIsDragging] = useState(false);
  const [currentHeight, setCurrentHeight] = useState(mergedConfig.peek);

  // ── Apply transform to DOM (no React re-render) ──
  const applyTransform = useCallback((height: number) => {
    const el = sheetRef.current;
    if (!el) return;
    // Sheet is full-height, translate from bottom to show `height` pixels
    const fullHeight = el.offsetHeight;
    const translateY = fullHeight - height;
    el.style.transform = `translateY(${translateY}px)`;
    currentHeightRef.current = height;
  }, []);

  // ── Resolve snap points based on viewport ──
  const resolveSnaps = useCallback(() => {
    const resolved = resolveSnapPoints(mergedConfig);
    snapsRef.current = resolved;
    orderedSnapsRef.current = getOrderedSnaps(resolved);
  }, [mergedConfig]);

  // ── Reduced motion preference ──
  const prefersReducedMotionRef = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReducedMotionRef.current = mq.matches;
    const handler = (e: MediaQueryListEvent) => {
      prefersReducedMotionRef.current = e.matches;
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Track current snap in a ref so resize handler is never stale
  const snapStateRef = useRef<SnapName>("peek");

  // ── Spring animation loop ──
  const animateSpring = useCallback(() => {
    const target = targetHeightRef.current;
    const current = currentHeightRef.current;
    let vel = velocityRef.current;

    // Damped spring: apply force then dampen
    vel += SPRING_STIFFNESS * (target - current);
    vel *= SPRING_DAMPING;

    const nextHeight = current + vel;
    velocityRef.current = vel;

    // Check if settled
    if (Math.abs(vel) < SETTLE_VELOCITY && Math.abs(target - nextHeight) < SETTLE_DISTANCE) {
      applyTransform(target);
      velocityRef.current = 0;
      animFrameRef.current = 0;

      // Final state update for React consumers
      setCurrentHeight(target);
      const snap = findNearestSnap(target, orderedSnapsRef.current);
      setSnapState(snap.name);
      snapStateRef.current = snap.name;
      return;
    }

    applyTransform(nextHeight);
    animFrameRef.current = requestAnimationFrame(animateSpring);
  }, [applyTransform]);

  // ── Snap to a target height with spring ──
  const animateToHeight = useCallback(
    (targetHeight: number) => {
      // Cancel any existing animation
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      targetHeightRef.current = targetHeight;

      // Skip animation for reduced motion
      if (prefersReducedMotionRef.current) {
        velocityRef.current = 0;
        applyTransform(targetHeight);
        setCurrentHeight(targetHeight);
        const snap = findNearestSnap(targetHeight, orderedSnapsRef.current);
        setSnapState(snap.name);
        snapStateRef.current = snap.name;
        return;
      }

      // Carry over drag velocity for natural feel, but cap it
      const maxVel = 40;
      velocityRef.current = Math.max(-maxVel, Math.min(maxVel, velocityRef.current));
      animFrameRef.current = requestAnimationFrame(animateSpring);
    },
    [animateSpring, applyTransform],
  );

  // ── Public snapTo ──
  const snapTo = useCallback(
    (snap: SnapName) => {
      const target = snapsRef.current[snap];
      if (target === undefined) return;
      velocityRef.current = 0;
      animateToHeight(target);
    },
    [animateToHeight],
  );

  // ── Rubber-band clamping ──
  const rubberBand = useCallback((rawHeight: number): number => {
    const snaps = snapsRef.current;
    const minH = snaps.mini;
    const maxH = snaps.full;

    if (rawHeight < minH) {
      const overshoot = minH - rawHeight;
      return minH - overshoot * RUBBER_BAND_FACTOR;
    }
    if (rawHeight > maxH) {
      const overshoot = rawHeight - maxH;
      return maxH + overshoot * RUBBER_BAND_FACTOR;
    }
    return rawHeight;
  }, []);

  // ── Touch handlers ──

  const onTouchStart: React.TouchEventHandler = useCallback(
    (e) => {
      // Cancel any running animation
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = 0;
      }

      const touch = e.touches[0];
      isDraggingRef.current = true;
      dragStartYRef.current = touch.clientY;
      dragStartHeightRef.current = currentHeightRef.current;
      touchSamplesRef.current = [{ y: touch.clientY, t: Date.now() }];

      setIsDragging(true);

      // Remove transition during drag for instant tracking
      if (sheetRef.current) {
        sheetRef.current.style.transition = "none";
      }
    },
    [],
  );

  const onTouchMove: React.TouchEventHandler = useCallback(
    (e) => {
      if (!isDraggingRef.current) return;

      const touch = e.touches[0];
      const deltaY = dragStartYRef.current - touch.clientY; // positive = finger moved up = expand
      const rawHeight = dragStartHeightRef.current + deltaY;
      const clampedHeight = rubberBand(rawHeight);

      applyTransform(clampedHeight);

      // Track touch samples for velocity
      const samples = touchSamplesRef.current;
      samples.push({ y: touch.clientY, t: Date.now() });
      // Keep only last N samples
      if (samples.length > VELOCITY_SAMPLE_COUNT) {
        samples.shift();
      }
    },
    [applyTransform, rubberBand],
  );

  const onTouchEnd: React.TouchEventHandler = useCallback(
    () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsDragging(false);

      const height = currentHeightRef.current;
      const velocity = computeVelocity(touchSamplesRef.current); // px/s, positive = upward
      touchSamplesRef.current = [];

      // Convert velocity to per-frame for spring (approx 60fps)
      velocityRef.current = velocity / 60;

      const ordered = orderedSnapsRef.current;

      let targetSnap: { name: SnapName; value: number };

      if (Math.abs(velocity) > FLICK_VELOCITY_THRESHOLD) {
        // Flick gesture: snap to adjacent in flick direction
        const direction = velocity > 0 ? "up" : "down";
        targetSnap = findAdjacentSnap(height, direction, ordered);
      } else {
        // No flick: snap to nearest
        targetSnap = findNearestSnap(height, ordered);
      }

      animateToHeight(targetSnap.value);
    },
    [animateToHeight],
  );

  // ── Initialize on mount ──
  useEffect(() => {
    resolveSnaps();

    // Set initial position
    const initialHeight = snapsRef.current.peek;
    currentHeightRef.current = initialHeight;
    setCurrentHeight(initialHeight);

    // Apply initial transform after DOM is ready
    requestAnimationFrame(() => {
      applyTransform(initialHeight);
      // Make visible after positioning
      if (sheetRef.current) {
        sheetRef.current.style.visibility = "visible";
      }
    });

    // Handle resize (viewport changes, keyboard, rotation)
    const onResize = () => {
      resolveSnaps();
      // Re-snap to current snap point with new values
      const currentSnap = snapsRef.current[snapStateRef.current];
      if (currentSnap !== undefined) {
        velocityRef.current = 0;
        applyTransform(currentSnap);
        setCurrentHeight(currentSnap);
      }
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    sheetRef,
    handleRef,
    currentHeight,
    snapState,
    isDragging,
    snapTo,
    touchHandlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
}
