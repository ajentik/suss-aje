export interface POI {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
  description: string;
  address?: string;
  hours?: string;
  rating?: number;
  notes?: string;
  cuisine?: string;
}

export interface CampusEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  time: string;
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
}

export interface RouteInfo {
  polyline: google.maps.LatLngLiteral[];
  distanceMeters: number;
  duration: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export type DateRangePreset = "all" | "1d" | "3d" | "7d";
