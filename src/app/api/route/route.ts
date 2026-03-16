import { NextResponse } from "next/server";

const API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";
const CAMPUS_ROUTE_BOUNDS = {
  minLat: 1.31,
  maxLat: 1.36,
  minLng: 103.74,
  maxLng: 103.80,
};

interface RouteRequestBody {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
}

function isFiniteCoordinate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isWithinCampusBounds(lat: number, lng: number) {
  return (
    lat >= CAMPUS_ROUTE_BOUNDS.minLat &&
    lat <= CAMPUS_ROUTE_BOUNDS.maxLat &&
    lng >= CAMPUS_ROUTE_BOUNDS.minLng &&
    lng <= CAMPUS_ROUTE_BOUNDS.maxLng
  );
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

  const { origin, destination } = body;
  if (
    !origin ||
    !destination ||
    !isFiniteCoordinate(origin.lat) ||
    !isFiniteCoordinate(origin.lng) ||
    !isFiniteCoordinate(destination.lat) ||
    !isFiniteCoordinate(destination.lng)
  ) {
    return NextResponse.json(
      { error: "origin and destination must have numeric lat/lng" },
      { status: 400 },
    );
  }

  if (
    !isWithinCampusBounds(origin.lat, origin.lng) ||
    !isWithinCampusBounds(destination.lat, destination.lng)
  ) {
    return NextResponse.json(
      { error: "Routes are limited to the SUSS campus area" },
      { status: 400 },
    );
  }

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
          origin: {
            location: {
              latLng: { latitude: origin.lat, longitude: origin.lng },
            },
          },
          destination: {
            location: {
              latLng: {
                latitude: destination.lat,
                longitude: destination.lng,
              },
            },
          },
          travelMode: "WALK",
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
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to reach Routes API" },
      { status: 502 },
    );
  }
}
