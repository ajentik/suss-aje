import type { POI, CampusEvent } from "@/types";

export function createStreetViewEventFromPOI(poi: POI): CampusEvent {
  return {
    id: `poi-${poi.id}`,
    title: poi.name,
    date: "",
    time: "",
    location: poi.address || poi.name,
    category: poi.category,
    description: poi.description,
    type: "On-Campus",
    school: "SUSS",
    lat: poi.lat,
    lng: poi.lng,
  };
}
