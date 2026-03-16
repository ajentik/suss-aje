"use client";

import { Component, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import {
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
  useMap,
} from "@vis.gl/react-google-maps";
import { useAppStore } from "@/store/app-store";
import { CAMPUS_CENTER, CAMPUS_POIS } from "@/lib/maps/campus-pois";
import type { POI, CampusEvent } from "@/types";
import RoutePolyline from "./RoutePolyline";
import { Plus, Minus } from "lucide-react";

class PinErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {}

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}

const SENIOR_MAP_STYLE: google.maps.MapTypeStyle[] = [
  {
    featureType: "all",
    elementType: "labels.text.fill",
    stylers: [{ color: "#1a1a1a" }, { weight: 1.5 }],
  },
  {
    featureType: "all",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#ffffff" }, { weight: 3 }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#cccccc" }],
  },
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#c8e6c9" }],
  },
  {
    featureType: "transit",
    elementType: "labels",
    stylers: [{ visibility: "simplified" }],
  },
  {
    featureType: "landscape.man_made",
    elementType: "geometry.stroke",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#a3d5f7" }],
  },
];

export default function MapView() {
  return <Map2DInner />;
}

type PinStyle = {
  background: string;
  borderColor: string;
  glyphColor: string;
  scale: number;
};

const POI_CATEGORY_COLORS: Record<string, { bg: string; border: string }> = {
  Building:    { bg: "#003B5C", border: "#FFD700" },
  Academic:    { bg: "#003B5C", border: "#4FC3F7" },
  Facility:    { bg: "#00796B", border: "#B2DFDB" },
  Food:        { bg: "#E65100", border: "#FFE0B2" },
  Restaurant:  { bg: "#D84315", border: "#FFCCBC" },
  Hawker:      { bg: "#BF360C", border: "#FFAB91" },
  Services:    { bg: "#5C6BC0", border: "#C5CAE9" },
  Transport:   { bg: "#0288D1", border: "#B3E5FC" },
  Mall:        { bg: "#7B1FA2", border: "#E1BEE7" },
  Supermarket: { bg: "#2E7D32", border: "#C8E6C9" },
  Bar:         { bg: "#AD1457", border: "#F8BBD0" },
  "Active Ageing Centre": { bg: "#00897B", border: "#E0F2F1" },
};

const POI_CATEGORY_SCALE: Record<string, number> = {
  Building: 1.2,
  Academic: 1.15,
  Facility: 1.1,
  Mall: 1.05,
};

function getPOIPinStyle(category: string, isSelected: boolean): PinStyle {
  const colors = POI_CATEGORY_COLORS[category] ?? { bg: "#DA291C", border: "#003B5C" };
  if (isSelected) {
    return {
      background: colors.bg,
      borderColor: "#DA291C",
      glyphColor: "#fff",
      scale: 1.4,
    };
  }
  return {
    background: colors.bg,
    borderColor: colors.border,
    glyphColor: "#fff",
    scale: POI_CATEGORY_SCALE[category] ?? 1.0,
  };
}

const EVENT_TYPE_COLORS: Record<string, { bg: string; border: string }> = {
  "On-Campus": { bg: "#F59E0B", border: "#78350F" },
  "Online":    { bg: "#8B5CF6", border: "#4C1D95" },
  "External":  { bg: "#10B981", border: "#064E3B" },
};

function getEventPinStyle(
  type: CampusEvent["type"],
  isHighlighted: boolean,
): PinStyle {
  const colors = EVENT_TYPE_COLORS[type] ?? EVENT_TYPE_COLORS["On-Campus"];
  if (isHighlighted) {
    return {
      background: colors.border,
      borderColor: "#003B5C",
      glyphColor: "#fff",
      scale: 1.35,
    };
  }
  return {
    background: colors.bg,
    borderColor: colors.border,
    glyphColor: "#fff",
    scale: 0.95,
  };
}

function Map2DInner() {
  const map = useMap();
  const flyToTarget = useAppStore((s) => s.flyToTarget);
  const setFlyToTarget = useAppStore((s) => s.setFlyToTarget);
  const routeInfo = useAppStore((s) => s.routeInfo);
  const mapEventMarkers = useAppStore((s) => s.mapEventMarkers);
  const setSelectedPOI = useAppStore((s) => s.setSelectedPOI);
  const selectedPOI = useAppStore((s) => s.selectedPOI);
  const selectedDestination = useAppStore((s) => s.selectedDestination);
  const highlightedEventIds = useAppStore((s) => s.highlightedEventIds);
  const setSelectedEvent = useAppStore((s) => s.setSelectedEvent);
  const [, setCurrentZoom] = useState(17);

  useEffect(() => {
    if (!flyToTarget || !map) return;
    map.panTo({ lat: flyToTarget.lat, lng: flyToTarget.lng });
    map.setZoom(18);
    setFlyToTarget(null);
  }, [flyToTarget, setFlyToTarget, map]);

  const nudgeCameraForMobile = useCallback(
    (lat: number, lng: number) => {
      if (typeof window === "undefined" || window.innerWidth >= 768) return;
      if (!map) return;
      const viewportHeight = window.innerHeight;
      const sheetPeekPx = 280;
      const currentZoomLevel = map.getZoom() ?? 17;
      const latOffsetDeg = (sheetPeekPx / viewportHeight) * 0.002;
      map.panTo({ lat: lat - latOffsetDeg, lng });
      map.setZoom(Math.max(currentZoomLevel, 17));
    },
    [map],
  );

  const handleMarkerClick = useCallback(
    (poi: POI) => {
      setSelectedPOI(poi);
      nudgeCameraForMobile(poi.lat, poi.lng);
    },
    [setSelectedPOI, nudgeCameraForMobile]
  );

  const handleEventMarkerClick = useCallback(
    (event: CampusEvent) => {
      setSelectedEvent(event);
      nudgeCameraForMobile(event.lat, event.lng);
    },
    [setSelectedEvent, nudgeCameraForMobile]
  );

  const handleZoomIn = useCallback(() => {
    if (!map) return;
    const z = map.getZoom() ?? 17;
    map.setZoom(z + 1);
    setCurrentZoom(z + 1);
  }, [map]);

  const handleZoomOut = useCallback(() => {
    if (!map) return;
    const z = map.getZoom() ?? 17;
    map.setZoom(z - 1);
    setCurrentZoom(z - 1);
  }, [map]);

  const handleZoomChanged = useCallback(() => {
    if (!map) return;
    setCurrentZoom(map.getZoom() ?? 17);
  }, [map]);

  return (
    <div className="w-full h-full relative">
      <GoogleMap
        defaultCenter={{ lat: CAMPUS_CENTER.lat, lng: CAMPUS_CENTER.lng }}
        defaultZoom={17}
        mapId="senior-friendly-2d"
        mapTypeId="roadmap"
        gestureHandling="greedy"
        disableDefaultUI
        styles={SENIOR_MAP_STYLE}
        tilt={0}
        isFractionalZoomEnabled={false}
        onZoomChanged={handleZoomChanged}
      >
        {CAMPUS_POIS.map((poi) => {
          const isSelected =
            selectedPOI?.id === poi.id ||
            selectedDestination?.id === poi.id;
          const pinStyle = getPOIPinStyle(poi.category, isSelected);
          return (
            <AdvancedMarker
              key={poi.id}
              position={{ lat: poi.lat, lng: poi.lng }}
              title={poi.name}
              onClick={() => handleMarkerClick(poi)}
            >
              <PinErrorBoundary>
                <Pin
                  background={pinStyle.background}
                  borderColor={pinStyle.borderColor}
                  glyphColor={pinStyle.glyphColor}
                  scale={pinStyle.scale}
                />
              </PinErrorBoundary>
            </AdvancedMarker>
          );
        })}

        {mapEventMarkers.map((event: CampusEvent) => {
          const isHighlighted = highlightedEventIds.includes(event.id);
          const eventPin = getEventPinStyle(event.type, isHighlighted);
          return (
            <AdvancedMarker
              key={event.id}
              position={{ lat: event.lat, lng: event.lng }}
              title={event.title}
              onClick={() => handleEventMarkerClick(event)}
            >
              <PinErrorBoundary>
                <Pin
                  background={eventPin.background}
                  borderColor={eventPin.borderColor}
                  glyphColor={eventPin.glyphColor}
                  scale={eventPin.scale}
                />
              </PinErrorBoundary>
            </AdvancedMarker>
          );
        })}

        {routeInfo && routeInfo.polyline.length > 0 && <RoutePolyline />}
      </GoogleMap>

      <div
        className="absolute right-3 z-10 flex flex-col gap-2"
        style={{ bottom: "calc(var(--sheet-height, 64px) + 16px)" }}
      >
        <button
          type="button"
          aria-label="Zoom in"
          onClick={handleZoomIn}
          className="flex items-center justify-center bg-card/90 backdrop-blur-xl border border-border/30 shadow-lg text-card-foreground hover:bg-card active:scale-95 transition-all duration-200 rounded-xl"
          style={{ width: 56, height: 56 }}
        >
          <Plus size={28} strokeWidth={2.5} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          onClick={handleZoomOut}
          className="flex items-center justify-center bg-card/90 backdrop-blur-xl border border-border/30 shadow-lg text-card-foreground hover:bg-card active:scale-95 transition-all duration-200 rounded-xl"
          style={{ width: 56, height: 56 }}
        >
          <Minus size={28} strokeWidth={2.5} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
