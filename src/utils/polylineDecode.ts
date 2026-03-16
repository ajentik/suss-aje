import type { LatLng, NavigationStep } from "@/types/navigation";

/**
 * Decode a Google encoded polyline string into an array of LatLng points.
 * @see https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
export function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
}

/**
 * Encode an array of LatLng points into a Google encoded polyline string.
 */
export function encodePolyline(path: LatLng[]): string {
  let encoded = "";
  let prevLat = 0;
  let prevLng = 0;

  for (const point of path) {
    const lat = Math.round(point.lat * 1e5);
    const lng = Math.round(point.lng * 1e5);

    encoded += encodeSignedValue(lat - prevLat);
    encoded += encodeSignedValue(lng - prevLng);

    prevLat = lat;
    prevLng = lng;
  }

  return encoded;
}

function encodeSignedValue(value: number): string {
  let v = value < 0 ? ~(value << 1) : value << 1;
  let encoded = "";

  while (v >= 0x20) {
    encoded += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
    v >>= 5;
  }

  encoded += String.fromCharCode(v + 63);
  return encoded;
}

const EARTH_RADIUS_METERS = 6_371_000;

/**
 * Calculate Haversine distance between two LatLng points in meters.
 */
export function distanceBetween(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const sinHalfDLat = Math.sin(dLat / 2);
  const sinHalfDLng = Math.sin(dLng / 2);

  const h =
    sinHalfDLat * sinHalfDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinHalfDLng * sinHalfDLng;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

/**
 * Check whether a position is within `thresholdMeters` of any segment on the route path.
 */
export function isOnRoute(
  position: LatLng,
  routePath: LatLng[],
  thresholdMeters: number,
): boolean {
  for (const point of routePath) {
    if (distanceBetween(position, point) <= thresholdMeters) {
      return true;
    }
  }
  return false;
}

/**
 * Find the nearest navigation step to a given position.
 * Returns the step index and distance in meters.
 */
export function findNearestStep(
  position: LatLng,
  steps: NavigationStep[],
): { stepIndex: number; distance: number } {
  let nearestIndex = 0;
  let nearestDistance = Infinity;

  for (let i = 0; i < steps.length; i++) {
    const d = distanceBetween(position, steps[i].startLocation);
    if (d < nearestDistance) {
      nearestDistance = d;
      nearestIndex = i;
    }
  }

  return { stepIndex: nearestIndex, distance: nearestDistance };
}
