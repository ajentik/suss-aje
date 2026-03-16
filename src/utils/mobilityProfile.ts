export type WalkingAidType = "independent" | "cane" | "walker" | "wheelchair";
export type FallRiskLevel = "none" | "low" | "high";

export interface MobilityProfile {
  level: WalkingAidType;
  fallRisk: FallRiskLevel;
  walkSpeedKmh: number;
  needsRest: boolean;
  restIntervalMeters: number;
  avoidStairs: boolean;
}

const WALK_SPEED: Record<WalkingAidType, number> = {
  independent: 4.5,
  cane: 3,
  walker: 1.5,
  wheelchair: 3,
};

const REST_INTERVAL: Record<WalkingAidType, number> = {
  independent: 500,
  cane: 300,
  walker: 200,
  wheelchair: 0,
};

const MOBILITY_MAP: Record<string, WalkingAidType> = {
  independent: "independent",
  "no aid": "independent",
  cane: "cane",
  stick: "cane",
  "walking stick": "cane",
  walker: "walker",
  frame: "walker",
  "walking frame": "walker",
  wheelchair: "wheelchair",
};

const FALL_RISK_MAP: Record<string, FallRiskLevel> = {
  none: "none",
  no: "none",
  "0": "none",
  low: "low",
  "1": "low",
  once: "low",
  high: "high",
  "2": "high",
  frequent: "high",
  multiple: "high",
  yes: "high",
};

export const DEFAULT_MOBILITY_PROFILE: MobilityProfile = {
  level: "independent",
  fallRisk: "none",
  walkSpeedKmh: 4.5,
  needsRest: false,
  restIntervalMeters: 500,
  avoidStairs: false,
};

function parseWalkingAid(value: string | undefined): WalkingAidType {
  if (!value) return "independent";
  const normalized = value.trim().toLowerCase();
  return MOBILITY_MAP[normalized] ?? "independent";
}

function parseFallRisk(value: string | undefined): FallRiskLevel {
  if (!value) return "none";
  const normalized = value.trim().toLowerCase();
  return FALL_RISK_MAP[normalized] ?? "none";
}

export function extractMobilityProfile(
  cgaResponses: Record<string, string>,
): MobilityProfile {
  const level = parseWalkingAid(cgaResponses["mobility_home"]);
  const fallRisk = parseFallRisk(cgaResponses["fall_history"]);

  const walkSpeedKmh = WALK_SPEED[level];
  const needsRest = level === "walker" || fallRisk === "high";
  const restIntervalMeters = REST_INTERVAL[level];
  const avoidStairs = level === "wheelchair" || level === "walker";

  return {
    level,
    fallRisk,
    walkSpeedKmh,
    needsRest,
    restIntervalMeters,
    avoidStairs,
  };
}
