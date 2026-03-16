import { describe, expect, it } from "vitest";
import {
  optimizeRouteForElderly,
} from "@/utils/elderlyRouteOptimizer";
import type { RouteResult } from "@/lib/maps/route-utils";
import type { RouteStep } from "@/types";

function makeStep(
  instruction: string,
  distanceMeters: number,
  durationText = "1 min",
  maneuver?: string,
): RouteStep {
  return { instruction, distanceMeters, durationText, maneuver };
}

const BASIC_STEPS: RouteStep[] = [
  makeStep("Head south on Clementi Road", 500, "6 min", "DEPART"),
  makeStep("Turn left onto Commonwealth Ave", 800, "10 min", "TURN_LEFT"),
  makeStep("Continue walking", 550, "7 min"),
];

const BASIC_ROUTE: RouteResult = {
  polyline: [
    { lat: 1.33, lng: 103.78 },
    { lat: 1.31, lng: 103.76 },
  ],
  distanceMeters: 1850,
  durationText: "10 min walk",
  steps: BASIC_STEPS,
};

describe("optimizeRouteForElderly", () => {
  describe("pace multiplier adjustments", () => {
    it("keeps original duration for normal mobility", () => {
      const result = optimizeRouteForElderly(BASIC_ROUTE, "normal");

      expect(result.adjustedDurationSeconds).toBe(600);
      expect(result.adjustedDurationText).toBe("10 min walk");
      expect(result.originalDurationText).toBe("10 min walk");
      expect(result.mobilityLevel).toBe("normal");
    });

    it("applies 1.8x multiplier for slow mobility", () => {
      const result = optimizeRouteForElderly(BASIC_ROUTE, "slow");

      expect(result.adjustedDurationSeconds).toBe(1080);
      expect(result.adjustedDurationText).toBe("18 min walk");
      expect(result.mobilityLevel).toBe("slow");
    });

    it("applies 3x multiplier for walker mobility", () => {
      const result = optimizeRouteForElderly(BASIC_ROUTE, "walker");

      expect(result.adjustedDurationSeconds).toBe(1800);
      expect(result.adjustedDurationText).toBe("30 min walk");
      expect(result.mobilityLevel).toBe("walker");
    });

    it("applies 1.5x multiplier for wheelchair mobility", () => {
      const result = optimizeRouteForElderly(BASIC_ROUTE, "wheelchair");

      expect(result.adjustedDurationSeconds).toBe(900);
      expect(result.adjustedDurationText).toBe("15 min walk");
      expect(result.mobilityLevel).toBe("wheelchair");
    });

    it("defaults to normal for unknown mobility level", () => {
      const result = optimizeRouteForElderly(BASIC_ROUTE, "jetpack");

      expect(result.adjustedDurationSeconds).toBe(600);
      expect(result.mobilityLevel).toBe("normal");
    });

    it("handles case-insensitive mobility level", () => {
      const result = optimizeRouteForElderly(BASIC_ROUTE, "SLOW");

      expect(result.adjustedDurationSeconds).toBe(1080);
      expect(result.mobilityLevel).toBe("slow");
    });

    it("trims whitespace in mobility level", () => {
      const result = optimizeRouteForElderly(BASIC_ROUTE, "  walker  ");

      expect(result.adjustedDurationSeconds).toBe(1800);
      expect(result.mobilityLevel).toBe("walker");
    });
  });

  describe("stairs detection", () => {
    it("detects stairs keyword in step instructions", () => {
      const route: RouteResult = {
        ...BASIC_ROUTE,
        steps: [
          makeStep("Take the stairs to level 2", 50),
          makeStep("Continue walking", 100),
        ],
      };
      const result = optimizeRouteForElderly(route, "normal");

      expect(result.hasStairs).toBe(true);
    });

    it("detects escalator keyword", () => {
      const route: RouteResult = {
        ...BASIC_ROUTE,
        steps: [makeStep("Use the escalator", 30)],
      };
      const result = optimizeRouteForElderly(route, "normal");

      expect(result.hasStairs).toBe(true);
    });

    it("detects staircase keyword", () => {
      const route: RouteResult = {
        ...BASIC_ROUTE,
        steps: [makeStep("Go up the staircase on your right", 40)],
      };
      const result = optimizeRouteForElderly(route, "normal");

      expect(result.hasStairs).toBe(true);
    });

    it("detects case-insensitive stairs references", () => {
      const route: RouteResult = {
        ...BASIC_ROUTE,
        steps: [makeStep("Take the STAIRS", 50)],
      };
      const result = optimizeRouteForElderly(route, "normal");

      expect(result.hasStairs).toBe(true);
    });

    it("returns false when no stairs are present", () => {
      const result = optimizeRouteForElderly(BASIC_ROUTE, "normal");

      expect(result.hasStairs).toBe(false);
    });
  });

  describe("accessibility rating", () => {
    it("rates accessible when no stairs present", () => {
      const result = optimizeRouteForElderly(BASIC_ROUTE, "normal");

      expect(result.accessibilityRating).toBe("accessible");
    });

    it("rates limited when stairs present for non-wheelchair users", () => {
      const route: RouteResult = {
        ...BASIC_ROUTE,
        steps: [makeStep("Take the stairs", 50)],
      };
      const result = optimizeRouteForElderly(route, "slow");

      expect(result.accessibilityRating).toBe("limited");
    });

    it("rates not_accessible when stairs present for wheelchair users", () => {
      const route: RouteResult = {
        ...BASIC_ROUTE,
        steps: [makeStep("Take the stairs", 50)],
      };
      const result = optimizeRouteForElderly(route, "wheelchair");

      expect(result.accessibilityRating).toBe("not_accessible");
    });

    it("rates accessible for wheelchair users without stairs", () => {
      const result = optimizeRouteForElderly(BASIC_ROUTE, "wheelchair");

      expect(result.accessibilityRating).toBe("accessible");
    });
  });

  describe("rest stop suggestions", () => {
    it("inserts rest stops every 200m for slow users", () => {
      const route: RouteResult = {
        ...BASIC_ROUTE,
        steps: [
          makeStep("Walk along path", 150),
          makeStep("Continue straight", 100),
          makeStep("Turn right", 200),
          makeStep("Continue to destination", 150),
        ],
      };
      const result = optimizeRouteForElderly(route, "slow");

      expect(result.restStops.length).toBeGreaterThanOrEqual(1);
      expect(result.restStops[0].afterStepIndex).toBe(1);
      expect(result.restStops[0].distanceFromStart).toBe(250);
      expect(result.restStops[0].suggestedDurationMin).toBe(3);
    });

    it("inserts rest stops for walker users", () => {
      const result = optimizeRouteForElderly(BASIC_ROUTE, "walker");

      expect(result.restStops.length).toBeGreaterThanOrEqual(1);
    });

    it("does not insert rest stops for normal users", () => {
      const result = optimizeRouteForElderly(BASIC_ROUTE, "normal");

      expect(result.restStops).toEqual([]);
    });

    it("does not insert rest stops for wheelchair users", () => {
      const result = optimizeRouteForElderly(BASIC_ROUTE, "wheelchair");

      expect(result.restStops).toEqual([]);
    });

    it("inserts multiple rest stops for long routes", () => {
      const route: RouteResult = {
        ...BASIC_ROUTE,
        distanceMeters: 700,
        steps: [
          makeStep("Step 1", 250),
          makeStep("Step 2", 250),
          makeStep("Step 3", 200),
        ],
      };
      const result = optimizeRouteForElderly(route, "slow");

      expect(result.restStops.length).toBe(3);
      expect(result.restStops[0].distanceFromStart).toBe(250);
      expect(result.restStops[1].distanceFromStart).toBe(500);
      expect(result.restStops[2].distanceFromStart).toBe(700);
    });

    it("includes descriptive reason in rest stops", () => {
      const route: RouteResult = {
        ...BASIC_ROUTE,
        steps: [makeStep("Walk along path", 300)],
      };
      const result = optimizeRouteForElderly(route, "slow");

      expect(result.restStops[0].reason).toContain("300m");
    });
  });

  describe("calorie estimation", () => {
    it("estimates calories for normal pace", () => {
      const result = optimizeRouteForElderly(BASIC_ROUTE, "normal");

      expect(result.estimatedCaloriesBurned).toBeGreaterThan(0);
      expect(result.estimatedCaloriesBurned).toBe(4.209);
    });

    it("estimates higher calories for slower pace", () => {
      const normal = optimizeRouteForElderly(BASIC_ROUTE, "normal");
      const slow = optimizeRouteForElderly(BASIC_ROUTE, "slow");

      expect(slow.estimatedCaloriesBurned).toBeGreaterThan(
        normal.estimatedCaloriesBurned,
      );
    });

    it("estimates highest calories for walker pace", () => {
      const slow = optimizeRouteForElderly(BASIC_ROUTE, "slow");
      const walker = optimizeRouteForElderly(BASIC_ROUTE, "walker");

      expect(walker.estimatedCaloriesBurned).toBeGreaterThan(
        slow.estimatedCaloriesBurned,
      );
    });
  });

  describe("output structure", () => {
    it("preserves original route data", () => {
      const result = optimizeRouteForElderly(BASIC_ROUTE, "normal");

      expect(result.distanceMeters).toBe(1850);
      expect(result.steps).toEqual(BASIC_STEPS);
    });

    it("returns all required fields", () => {
      const result = optimizeRouteForElderly(BASIC_ROUTE, "slow");

      expect(result).toHaveProperty("originalDurationText");
      expect(result).toHaveProperty("adjustedDurationText");
      expect(result).toHaveProperty("adjustedDurationSeconds");
      expect(result).toHaveProperty("distanceMeters");
      expect(result).toHaveProperty("steps");
      expect(result).toHaveProperty("hasStairs");
      expect(result).toHaveProperty("accessibilityRating");
      expect(result).toHaveProperty("restStops");
      expect(result).toHaveProperty("estimatedCaloriesBurned");
      expect(result).toHaveProperty("mobilityLevel");
    });

    it("handles empty steps array", () => {
      const route: RouteResult = {
        ...BASIC_ROUTE,
        steps: [],
      };
      const result = optimizeRouteForElderly(route, "slow");

      expect(result.hasStairs).toBe(false);
      expect(result.restStops).toEqual([]);
      expect(result.accessibilityRating).toBe("accessible");
    });

    it("handles route with zero distance", () => {
      const route: RouteResult = {
        ...BASIC_ROUTE,
        distanceMeters: 0,
        durationText: "0 min walk",
        steps: [],
      };
      const result = optimizeRouteForElderly(route, "slow");

      expect(result.adjustedDurationSeconds).toBe(0);
      expect(result.estimatedCaloriesBurned).toBe(0);
    });
  });
});
