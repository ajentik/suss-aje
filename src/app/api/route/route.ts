import { NextResponse } from "next/server";

const API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";

type MobilityLevel = "normal" | "slow" | "walker" | "wheelchair";

interface LatLngDestination {
  lat: number;
  lng: number;
}

interface PlaceIdDestination {
  placeId: string;
}

interface RouteRequestBody {
  origin: { lat: number; lng: number };
  destination: LatLngDestination | PlaceIdDestination;
  mobilityLevel?: MobilityLevel;
}

const MOBILITY_MULTIPLIERS: Record<MobilityLevel, number> = {
  normal: 1,
  slow: 1.8,
  walker: 3,
  wheelchair: 1.5,
};

const VALID_MOBILITY_LEVELS = new Set<string>(Object.keys(MOBILITY_MULTIPLIERS));

function isFiniteCoordinate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isPlaceIdDestination(
  dest: LatLngDestination | PlaceIdDestination,
): dest is PlaceIdDestination {
  return "placeId" in dest && typeof (dest as PlaceIdDestination).placeId === "string";
}

function isLatLngDestination(
  dest: LatLngDestination | PlaceIdDestination,
): dest is LatLngDestination {
  return (
    "lat" in dest &&
    "lng" in dest &&
    isFiniteCoordinate((dest as LatLngDestination).lat) &&
    isFiniteCoordinate((dest as LatLngDestination).lng)
  );
}

/**
 * Check whether a step's instruction text hints at stairs.
 * Google Routes API doesn't provide a structured "stairs" flag, so we
 * inspect the human-readable instruction.
 */
function stepHasStairs(instructionText: string): boolean {
  return /\bstair/i.test(instructionText);
}

function buildOriginWaypoint(origin: { lat: number; lng: number }) {
  return {
    location: {
      latLng: { latitude: origin.lat, longitude: origin.lng },
    },
  };
}

function buildDestinationWaypoint(dest: LatLngDestination | PlaceIdDestination) {
  if (isPlaceIdDestination(dest)) {
    return { placeId: dest.placeId };
  }
  return {
    location: {
      latLng: {
        latitude: (dest as LatLngDestination).lat,
        longitude: (dest as LatLngDestination).lng,
      },
    },
  };
}

interface ParsedStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  maneuver?: string;
  hasStairs: boolean;
}

interface ParsedRoute {
  polyline: string;
  steps: ParsedStep[];
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  mobilityAdjustedDurationSeconds: number;
  hasStairs: boolean;
}

interface GoogleRawStep {
  navigationInstruction?: { instructions?: string; maneuver?: string };
  distanceMeters?: number;
  staticDuration?: string;
  travelAdvisory?: Record<string, unknown>;
}

interface GoogleRawRoute {
  polyline?: { encodedPolyline?: string };
  distanceMeters?: number;
  duration?: string;
  legs?: Array<{ steps?: GoogleRawStep[] }>;
}

function parseRoute(
  route: GoogleRawRoute,
  mobilityMultiplier: number,
): ParsedRoute {
  const rawSteps: GoogleRawStep[] = route.legs?.[0]?.steps ?? [];

  let routeHasStairs = false;

  const steps: ParsedStep[] = rawSteps.map((step) => {
    const instructionText =
      step.navigationInstruction?.instructions ?? "Continue walking";
    const distanceMeters = step.distanceMeters ?? 0;
    const durationSeconds = step.staticDuration
      ? parseInt(step.staticDuration.replace("s", ""), 10)
      : 0;
    const hasStairs = stepHasStairs(instructionText);

    if (hasStairs) routeHasStairs = true;

    return {
      instruction: instructionText,
      distanceMeters,
      durationSeconds,
      maneuver: step.navigationInstruction?.maneuver,
      hasStairs,
    };
  });

  for (const step of rawSteps) {
    if (
      step.travelAdvisory &&
      JSON.stringify(step.travelAdvisory).toLowerCase().includes("stair")
    ) {
      routeHasStairs = true;
    }
  }

  const totalDurationSeconds = route.duration
    ? parseInt(route.duration.replace("s", ""), 10)
    : 0;

  return {
    polyline: route.polyline?.encodedPolyline ?? "",
    steps,
    totalDistanceMeters: route.distanceMeters ?? 0,
    totalDurationSeconds,
    mobilityAdjustedDurationSeconds: Math.ceil(
      totalDurationSeconds * mobilityMultiplier,
    ),
    hasStairs: routeHasStairs,
  };
}

export async function POST(req: Request) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: "GOOGLE_MAPS_API_KEY is not configured on the server" },
      { status: 500 },
    );
  }

  let body: RouteRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { origin, destination, mobilityLevel } = body;

  if (
    !origin ||
    !isFiniteCoordinate(origin.lat) ||
    !isFiniteCoordinate(origin.lng)
  ) {
    return NextResponse.json(
      { error: "origin must have numeric lat/lng" },
      { status: 400 },
    );
  }

  if (!destination) {
    return NextResponse.json(
      { error: "destination is required" },
      { status: 400 },
    );
  }

  if (!isPlaceIdDestination(destination) && !isLatLngDestination(destination)) {
    return NextResponse.json(
      { error: "destination must have numeric lat/lng or a placeId string" },
      { status: 400 },
    );
  }

  const resolvedMobility: MobilityLevel =
    mobilityLevel && VALID_MOBILITY_LEVELS.has(mobilityLevel)
      ? mobilityLevel
      : "normal";

  const mobilityMultiplier = MOBILITY_MULTIPLIERS[resolvedMobility];

  const routeModifiers: Record<string, boolean> =
    resolvedMobility === "wheelchair" ? { avoidStairs: true } : {};

  try {
    const response = await fetch(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": API_KEY,
          "X-Goog-FieldMask":
            "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.steps.navigationInstruction,routes.legs.steps.distanceMeters,routes.legs.steps.staticDuration,routes.legs.steps.travelAdvisory",
        },
        body: JSON.stringify({
          origin: buildOriginWaypoint(origin),
          destination: buildDestinationWaypoint(destination),
          travelMode: "WALK",
          computeAlternativeRoutes: true,
          ...(Object.keys(routeModifiers).length > 0 && { routeModifiers }),
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: "Routes API error", detail: text },
        { status: response.status },
      );
    }

    const data = await response.json();
    const rawRoutes: GoogleRawRoute[] = data.routes ?? [];

    const routes: ParsedRoute[] = rawRoutes.map((r) =>
      parseRoute(r, mobilityMultiplier),
    );

    return NextResponse.json({
      routes,
      mobilityLevel: resolvedMobility,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to reach Routes API" },
      { status: 502 },
    );
  }
}
