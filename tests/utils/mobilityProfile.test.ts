import { describe, expect, it } from "vitest";
import {
  extractMobilityProfile,
  DEFAULT_MOBILITY_PROFILE,
  type MobilityProfile,
} from "@/utils/mobilityProfile";

describe("extractMobilityProfile", () => {
  describe("walking aid type from mobility_home", () => {
    it("maps 'independent' to independent", () => {
      const profile = extractMobilityProfile({ mobility_home: "independent" });

      expect(profile.level).toBe("independent");
      expect(profile.walkSpeedKmh).toBe(4.5);
    });

    it("maps 'cane' to cane", () => {
      const profile = extractMobilityProfile({ mobility_home: "cane" });

      expect(profile.level).toBe("cane");
      expect(profile.walkSpeedKmh).toBe(3);
    });

    it("maps 'walking stick' to cane", () => {
      const profile = extractMobilityProfile({
        mobility_home: "walking stick",
      });

      expect(profile.level).toBe("cane");
    });

    it("maps 'walker' to walker", () => {
      const profile = extractMobilityProfile({ mobility_home: "walker" });

      expect(profile.level).toBe("walker");
      expect(profile.walkSpeedKmh).toBe(1.5);
    });

    it("maps 'walking frame' to walker", () => {
      const profile = extractMobilityProfile({
        mobility_home: "walking frame",
      });

      expect(profile.level).toBe("walker");
    });

    it("maps 'wheelchair' to wheelchair", () => {
      const profile = extractMobilityProfile({ mobility_home: "wheelchair" });

      expect(profile.level).toBe("wheelchair");
      expect(profile.walkSpeedKmh).toBe(3);
    });

    it("defaults to independent for unknown values", () => {
      const profile = extractMobilityProfile({
        mobility_home: "jetpack",
      });

      expect(profile.level).toBe("independent");
      expect(profile.walkSpeedKmh).toBe(4.5);
    });

    it("defaults to independent when mobility_home is missing", () => {
      const profile = extractMobilityProfile({});

      expect(profile.level).toBe("independent");
    });

    it("handles case-insensitive input", () => {
      const profile = extractMobilityProfile({ mobility_home: "Wheelchair" });

      expect(profile.level).toBe("wheelchair");
    });

    it("handles whitespace-padded input", () => {
      const profile = extractMobilityProfile({ mobility_home: "  walker  " });

      expect(profile.level).toBe("walker");
    });
  });

  describe("fall risk from fall_history", () => {
    it("maps 'none' to none", () => {
      const profile = extractMobilityProfile({ fall_history: "none" });

      expect(profile.fallRisk).toBe("none");
    });

    it("maps 'no' to none", () => {
      const profile = extractMobilityProfile({ fall_history: "no" });

      expect(profile.fallRisk).toBe("none");
    });

    it("maps 'low' to low", () => {
      const profile = extractMobilityProfile({ fall_history: "low" });

      expect(profile.fallRisk).toBe("low");
    });

    it("maps 'once' to low", () => {
      const profile = extractMobilityProfile({ fall_history: "once" });

      expect(profile.fallRisk).toBe("low");
    });

    it("maps 'high' to high", () => {
      const profile = extractMobilityProfile({ fall_history: "high" });

      expect(profile.fallRisk).toBe("high");
    });

    it("maps 'frequent' to high", () => {
      const profile = extractMobilityProfile({ fall_history: "frequent" });

      expect(profile.fallRisk).toBe("high");
    });

    it("maps 'yes' to high", () => {
      const profile = extractMobilityProfile({ fall_history: "yes" });

      expect(profile.fallRisk).toBe("high");
    });

    it("defaults to none for unknown values", () => {
      const profile = extractMobilityProfile({
        fall_history: "banana",
      });

      expect(profile.fallRisk).toBe("none");
    });

    it("defaults to none when fall_history is missing", () => {
      const profile = extractMobilityProfile({});

      expect(profile.fallRisk).toBe("none");
    });
  });

  describe("walking speed inference", () => {
    it.each<[string, number]>([
      ["independent", 4.5],
      ["cane", 3],
      ["walker", 1.5],
      ["wheelchair", 3],
    ])(
      "assigns %s → %s km/h",
      (mobilityHome: string, expectedSpeed: number) => {
        const profile = extractMobilityProfile({
          mobility_home: mobilityHome,
        });

        expect(profile.walkSpeedKmh).toBe(expectedSpeed);
      },
    );
  });

  describe("needsRest inference", () => {
    it("is true for walker users", () => {
      const profile = extractMobilityProfile({ mobility_home: "walker" });

      expect(profile.needsRest).toBe(true);
    });

    it("is true when fall_history is high", () => {
      const profile = extractMobilityProfile({
        mobility_home: "independent",
        fall_history: "high",
      });

      expect(profile.needsRest).toBe(true);
    });

    it("is true for walker + high fall risk", () => {
      const profile = extractMobilityProfile({
        mobility_home: "walker",
        fall_history: "high",
      });

      expect(profile.needsRest).toBe(true);
    });

    it("is false for independent with no fall history", () => {
      const profile = extractMobilityProfile({
        mobility_home: "independent",
        fall_history: "none",
      });

      expect(profile.needsRest).toBe(false);
    });

    it("is false for cane with low fall risk", () => {
      const profile = extractMobilityProfile({
        mobility_home: "cane",
        fall_history: "low",
      });

      expect(profile.needsRest).toBe(false);
    });

    it("is false for wheelchair with no fall history", () => {
      const profile = extractMobilityProfile({
        mobility_home: "wheelchair",
        fall_history: "none",
      });

      expect(profile.needsRest).toBe(false);
    });
  });

  describe("restIntervalMeters", () => {
    it("is 500 for independent", () => {
      const profile = extractMobilityProfile({ mobility_home: "independent" });

      expect(profile.restIntervalMeters).toBe(500);
    });

    it("is 300 for cane", () => {
      const profile = extractMobilityProfile({ mobility_home: "cane" });

      expect(profile.restIntervalMeters).toBe(300);
    });

    it("is 200 for walker", () => {
      const profile = extractMobilityProfile({ mobility_home: "walker" });

      expect(profile.restIntervalMeters).toBe(200);
    });

    it("is 0 for wheelchair", () => {
      const profile = extractMobilityProfile({ mobility_home: "wheelchair" });

      expect(profile.restIntervalMeters).toBe(0);
    });
  });

  describe("avoidStairs", () => {
    it("is true for wheelchair", () => {
      const profile = extractMobilityProfile({ mobility_home: "wheelchair" });

      expect(profile.avoidStairs).toBe(true);
    });

    it("is true for walker", () => {
      const profile = extractMobilityProfile({ mobility_home: "walker" });

      expect(profile.avoidStairs).toBe(true);
    });

    it("is false for cane", () => {
      const profile = extractMobilityProfile({ mobility_home: "cane" });

      expect(profile.avoidStairs).toBe(false);
    });

    it("is false for independent", () => {
      const profile = extractMobilityProfile({ mobility_home: "independent" });

      expect(profile.avoidStairs).toBe(false);
    });
  });

  describe("combined CGA responses", () => {
    it("builds full profile for walker + high fall risk", () => {
      const profile = extractMobilityProfile({
        mobility_home: "walker",
        fall_history: "high",
      });

      expect(profile).toEqual({
        level: "walker",
        fallRisk: "high",
        walkSpeedKmh: 1.5,
        needsRest: true,
        restIntervalMeters: 200,
        avoidStairs: true,
      } satisfies MobilityProfile);
    });

    it("builds full profile for cane + low fall risk", () => {
      const profile = extractMobilityProfile({
        mobility_home: "cane",
        fall_history: "low",
      });

      expect(profile).toEqual({
        level: "cane",
        fallRisk: "low",
        walkSpeedKmh: 3,
        needsRest: false,
        restIntervalMeters: 300,
        avoidStairs: false,
      } satisfies MobilityProfile);
    });

    it("ignores unrelated CGA keys", () => {
      const profile = extractMobilityProfile({
        mobility_home: "cane",
        fall_history: "low",
        vision: "normal",
        hearing: "mild loss",
      });

      expect(profile.level).toBe("cane");
      expect(profile.fallRisk).toBe("low");
    });
  });

  describe("DEFAULT_MOBILITY_PROFILE", () => {
    it("matches expected default values", () => {
      expect(DEFAULT_MOBILITY_PROFILE).toEqual({
        level: "independent",
        fallRisk: "none",
        walkSpeedKmh: 4.5,
        needsRest: false,
        restIntervalMeters: 500,
        avoidStairs: false,
      } satisfies MobilityProfile);
    });

    it("matches profile for empty CGA responses", () => {
      const profile = extractMobilityProfile({});

      expect(profile).toEqual(DEFAULT_MOBILITY_PROFILE);
    });
  });
});
