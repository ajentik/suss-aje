export type PriceLevel = 1 | 2 | 3 | 4;

export interface POI {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
  description: string;
  address?: string;
  hours?: string;
  contact?: string;
  rating?: number;
  notes?: string;
  cuisine?: string;
  tags?: string[];
  distanceFromCampus?: string;
  website?: string;
  priceLevel?: PriceLevel;
}

export interface CampusEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  time: string;
  endTime?: string;
  recurrence?: string;
  tags?: string[];
  location: string;
  category: string;
  description: string;
  type: "On-Campus" | "Online" | "External";
  school: "SUSS" | "SIM";
  lat: number;
  lng: number;
  url?: string;
  venueAddress?: string;
  longDescription?: string;
  registrationUrl?: string;
}

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  durationText: string;
  maneuver?: string;
}

export interface RouteInfo {
  polyline: google.maps.LatLngLiteral[];
  distanceMeters: number;
  duration: string;
  steps: RouteStep[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export type DateRangePreset = "all" | "1d" | "3d" | "7d";

export interface FeedbackEntry {
  original: string;
  corrected: string | null;
  timestamp: number;
  provider: string;
}
