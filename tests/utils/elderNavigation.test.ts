import { describe, expect, it } from "vitest";
import {
  estimateElderlyWalkTime,
  findRestStops,
  assessRouteAccessibility,
} from "@/utils/elderNavigation";
import type { RouteStep } from "@/types";

describe("estimateElderlyWalkTime", () => {
  it("returns correct minutes for normal speed (4.5 km/h)", () => {
    const result = estimateElderlyWalkTime(1000, "normal");
    expect(result).toBe(14);
  });

  it("returns correct minutes for slow speed (2.5 km/h)", () => {
    const result = estimateElderlyWalkTime(1000, "slow");
    expect(result).toBe(24);
  });

  it("returns correct minutes for walker speed (1.5 km/h)", () => {
    const result = estimateElderlyWalkTime(1000, "walker");
    expect(result).toBe(40);
  });

  it("returns correct minutes for wheelchair speed (3 km/h)", () => {
    const result = estimateElderlyWalkTime(1000, "wheelchair");
    expect(result).toBe(20);
  });

  it("rounds up to next whole minute", () => {
    const result = estimateElderlyWalkTime(10, "normal");
    expect(result).toBe(1);
  });

  it("returns 0 for zero distance", () => {
    const result = estimateElderlyWalkTime(0, "normal");
    expect(result).toBe(0);
  });
});

describe("findRestStops", () => {
  const makeStep = (distanceMeters: number, instruction = "Walk"): RouteStep => ({
    instruction,
    distanceMeters,
    durationText: "1 min",
  });

  it("returns empty array for normal mobility", () => {
    const steps = [makeStep(500)];
    expect(findRestStops(steps, "normal")).toEqual([]);
  });

  it("returns empty array for wheelchair mobility", () => {
    const steps = [makeStep(500)];
    expect(findRestStops(steps, "wheelchair")).toEqual([]);
  });

  it("suggests rest stop every 200m for slow mobility", () => {
    const steps = [makeStep(100), makeStep(150), makeStep(200)];
    const stops = findRestStops(steps, "slow");
    expect(stops).toHaveLength(2);
    expect(stops[0].stepIndex).toBe(1);
    expect(stops[0].cumulativeDistance).toBe(250);
    expect(stops[1].stepIndex).toBe(2);
    expect(stops[1].cumulativeDistance).toBe(450);
  });

  it("suggests rest stop every 200m for walker mobility", () => {
    const steps = [makeStep(250), makeStep(250)];
    const stops = findRestStops(steps, "walker");
    expect(stops).toHaveLength(2);
    expect(stops[0].cumulativeDistance).toBe(250);
    expect(stops[1].cumulativeDistance).toBe(500);
  });

  it("returns empty for route shorter than 200m", () => {
    const steps = [makeStep(50), makeStep(50)];
    const stops = findRestStops(steps, "slow");
    expect(stops).toEqual([]);
  });

  it("includes human-readable label", () => {
    const steps = [makeStep(300)];
    const stops = findRestStops(steps, "slow");
    expect(stops[0].label).toBe("Rest after 300 m");
  });

  it("defaults to slow when no mobilityLevel provided", () => {
    const steps = [makeStep(300)];
    const stops = findRestStops(steps);
    expect(stops).toHaveLength(1);
  });
});

describe("assessRouteAccessibility", () => {
  const makeStep = (instruction: string): RouteStep => ({
    instruction,
    distanceMeters: 100,
    durationText: "1 min",
  });

  it("detects stairs in route instructions", () => {
    const steps = [makeStep("Take the stairs to level 2")];
    const result = assessRouteAccessibility(steps);
    expect(result.hasStairs).toBe(true);
    expect(result.hasSteepSlope).toBe(false);
    expect(result.isSheltered).toBe(false);
  });

  it("detects steep slope in route instructions", () => {
    const steps = [makeStep("Walk up the steep hill")];
    const result = assessRouteAccessibility(steps);
    expect(result.hasStairs).toBe(false);
    expect(result.hasSteepSlope).toBe(true);
  });

  it("detects sheltered route", () => {
    const steps = [makeStep("Walk through the covered walkway")];
    const result = assessRouteAccessibility(steps);
    expect(result.isSheltered).toBe(true);
  });

  it("detects multiple accessibility issues", () => {
    const steps = [
      makeStep("Take the stairs"),
      makeStep("Walk up the steep incline"),
      makeStep("Enter the indoor corridor"),
    ];
    const result = assessRouteAccessibility(steps);
    expect(result.hasStairs).toBe(true);
    expect(result.hasSteepSlope).toBe(true);
    expect(result.isSheltered).toBe(true);
  });

  it("returns all false for plain instructions", () => {
    const steps = [
      makeStep("Head north on Clementi Road"),
      makeStep("Turn left at the junction"),
    ];
    const result = assessRouteAccessibility(steps);
    expect(result.hasStairs).toBe(false);
    expect(result.hasSteepSlope).toBe(false);
    expect(result.isSheltered).toBe(false);
  });

  it("handles empty steps array", () => {
    const result = assessRouteAccessibility([]);
    expect(result.hasStairs).toBe(false);
    expect(result.hasSteepSlope).toBe(false);
    expect(result.isSheltered).toBe(false);
  });
});
