import type { RouteStep, MobilityLevel, RestStop, RouteAccessibility } from "@/types";

const SPEED_KMH: Record<MobilityLevel, number> = {
  normal: 4.5,
  slow: 2.5,
  walker: 1.5,
  wheelchair: 3,
};

const REST_INTERVAL_METERS = 200;
const REST_MOBILITY_LEVELS: ReadonlySet<MobilityLevel> = new Set(["slow", "walker"]);

const STAIR_KEYWORDS = ["stair", "steps", "escalator"];
const SLOPE_KEYWORDS = ["slope", "hill", "ramp", "steep", "incline"];
const SHELTER_KEYWORDS = ["shelter", "covered", "indoor", "underpass", "corridor"];

function textMatchesAny(text: string, keywords: readonly string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

export function estimateElderlyWalkTime(
  distanceMeters: number,
  mobilityLevel: MobilityLevel,
): number {
  const speedMs = (SPEED_KMH[mobilityLevel] * 1000) / 3600;
  return Math.ceil(distanceMeters / speedMs / 60);
}

export function findRestStops(
  routeSteps: RouteStep[],
  mobilityLevel: MobilityLevel = "slow",
): RestStop[] {
  if (!REST_MOBILITY_LEVELS.has(mobilityLevel)) return [];

  const stops: RestStop[] = [];
  let cumulative = 0;
  let sinceLast = 0;

  for (let i = 0; i < routeSteps.length; i++) {
    const step = routeSteps[i];
    cumulative += step.distanceMeters;
    sinceLast += step.distanceMeters;

    if (sinceLast >= REST_INTERVAL_METERS) {
      stops.push({
        stepIndex: i,
        cumulativeDistance: cumulative,
        label: `Rest after ${Math.round(cumulative)} m`,
      });
      sinceLast = 0;
    }
  }

  return stops;
}

export function assessRouteAccessibility(steps: RouteStep[]): RouteAccessibility {
  let hasStairs = false;
  let hasSteepSlope = false;
  let isSheltered = false;

  for (const step of steps) {
    const text = step.instruction;
    if (!hasStairs && textMatchesAny(text, STAIR_KEYWORDS)) hasStairs = true;
    if (!hasSteepSlope && textMatchesAny(text, SLOPE_KEYWORDS)) hasSteepSlope = true;
    if (!isSheltered && textMatchesAny(text, SHELTER_KEYWORDS)) isSheltered = true;

    if (hasStairs && hasSteepSlope && isSheltered) break;
  }

  return { hasStairs, hasSteepSlope, isSheltered };
}
