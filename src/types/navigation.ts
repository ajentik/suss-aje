export interface LatLng {
  lat: number;
  lng: number;
}

export interface NavigationStep {
  instruction: string;
  distance: number;
  duration: number;
  maneuver: string;
  startLocation: LatLng;
  endLocation: LatLng;
}

export interface NavigationRoute {
  polyline: string;
  decodedPath: LatLng[];
  steps: NavigationStep[];
  totalDistance: number;
  totalDuration: number;
  mobilityAdjustedDuration?: number;
  hasStairs: boolean;
}

export interface NavigationState {
  isNavigating: boolean;
  currentStepIndex: number;
  distanceToNextTurn: number;
  isOffRoute: boolean;
  eta: Date;
}

export interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  openNow?: boolean;
  distance?: number;
}

export interface MobilityProfile {
  level: "normal" | "slow" | "walker" | "wheelchair";
  walkSpeedKmh: number;
  needsRest: boolean;
  restIntervalMeters: number;
  avoidStairs: boolean;
}
