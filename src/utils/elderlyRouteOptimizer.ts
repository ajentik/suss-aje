import type { RouteStep } from "@/types";
import type { RouteResult } from "@/lib/maps/route-utils";

export type AccessibilityRating = "accessible" | "limited" | "not_accessible";

export type MobilityLevel = "normal" | "slow" | "walker" | "wheelchair";

export interface RestStop {
  afterStepIndex: number;
  distanceFromStart: number;
  suggestedDurationMin: number;
  reason: string;
}

export interface OptimizedRoute {
  originalDurationText: string;
  adjustedDurationText: string;
  adjustedDurationSeconds: number;
  distanceMeters: number;
  steps: RouteStep[];
  hasStairs: boolean;
  accessibilityRating: AccessibilityRating;
  restStops: RestStop[];
  estimatedCaloriesBurned: number;
  mobilityLevel: MobilityLevel;
}

const PACE_MULTIPLIERS: Record<MobilityLevel, number> = {
  normal: 1,
  slow: 1.8,
  walker: 3,
  wheelchair: 1.5,
};

const STAIRS_KEYWORDS = [
  "stairs",
  "staircase",
  "stairway",
  "steps",
  "escalator",
  "escalators",
  "climb",
  "flight",
];

/** kcal per kg per metre for level walking */
const BASE_CALORIE_RATE = 0.035;

const REST_STOP_INTERVAL_M = 200;

const REST_STOP_DURATION_MIN = 3;

const DEFAULT_WEIGHT_KG = 65;

function parseMobilityLevel(level: string): MobilityLevel {
  const normalised = level.toLowerCase().trim();
  if (normalised in PACE_MULTIPLIERS) {
    return normalised as MobilityLevel;
  }
  return "normal";
}

function parseDurationSeconds(durationText: string): number {
  const match = durationText.match(/(\d+)/);
  if (!match) return 0;
  return parseInt(match[1], 10) * 60;
}

function scanForStairs(steps: RouteStep[]): boolean {
  return steps.some((step) => {
    const text = step.instruction.toLowerCase();
    return STAIRS_KEYWORDS.some((kw) => text.includes(kw));
  });
}

function rateAccessibility(
  hasStairs: boolean,
  mobilityLevel: MobilityLevel,
): AccessibilityRating {
  if (mobilityLevel === "wheelchair" && hasStairs) {
    return "not_accessible";
  }
  if (hasStairs) {
    return "limited";
  }
  return "accessible";
}

function computeRestStops(
  steps: RouteStep[],
  mobilityLevel: MobilityLevel,
): RestStop[] {
  const needsRestStops = mobilityLevel === "slow" || mobilityLevel === "walker";
  if (!needsRestStops) return [];

  const stops: RestStop[] = [];
  let cumulativeDistance = 0;
  let lastStopDistance = 0;

  for (let i = 0; i < steps.length; i++) {
    cumulativeDistance += steps[i].distanceMeters;

    if (cumulativeDistance - lastStopDistance >= REST_STOP_INTERVAL_M) {
      stops.push({
        afterStepIndex: i,
        distanceFromStart: cumulativeDistance,
        suggestedDurationMin: REST_STOP_DURATION_MIN,
        reason: `Rest after ${Math.round(cumulativeDistance)}m of walking`,
      });
      lastStopDistance = cumulativeDistance;
    }
  }

  return stops;
}

function estimateCalories(
  distanceMeters: number,
  mobilityLevel: MobilityLevel,
): number {
  const paceAdjustment = PACE_MULTIPLIERS[mobilityLevel];
  const adjustedRate = BASE_CALORIE_RATE * (1 + (paceAdjustment - 1) * 0.1);
  return Math.round(adjustedRate * DEFAULT_WEIGHT_KG * distanceMeters) / 1000;
}

function formatDuration(seconds: number): string {
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} min walk`;
}

export function optimizeRouteForElderly(
  route: RouteResult,
  mobilityLevel: string,
): OptimizedRoute {
  const level = parseMobilityLevel(mobilityLevel);
  const multiplier = PACE_MULTIPLIERS[level];

  const originalSeconds = parseDurationSeconds(route.durationText);
  const adjustedSeconds = Math.ceil(originalSeconds * multiplier);

  const hasStairs = scanForStairs(route.steps);
  const accessibilityRating = rateAccessibility(hasStairs, level);
  const restStops = computeRestStops(route.steps, level);
  const estimatedCaloriesBurned = estimateCalories(route.distanceMeters, level);

  return {
    originalDurationText: route.durationText,
    adjustedDurationText: formatDuration(adjustedSeconds),
    adjustedDurationSeconds: adjustedSeconds,
    distanceMeters: route.distanceMeters,
    steps: route.steps,
    hasStairs,
    accessibilityRating,
    restStops,
    estimatedCaloriesBurned,
    mobilityLevel: level,
  };
}
