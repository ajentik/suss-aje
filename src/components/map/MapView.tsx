"use client";

import { Component, useEffect, useRef, useState, useCallback } from "react";
import type { ReactNode, ErrorInfo } from "react";
import { Map3D, Marker3D, Pin } from "@vis.gl/react-google-maps";
import type {
  Map3DRef,
  Map3DClickEvent,
  Map3DCameraChangedEvent,
} from "@vis.gl/react-google-maps";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/store/app-store";
import { CAMPUS_CENTER, CAMPUS_POIS } from "@/lib/maps/campus-pois";
import type { POI, CampusEvent } from "@/types";
import RoutePolyline from "./RoutePolyline";
import StreetViewPanel from "./StreetViewPanel";

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

  componentDidCatch(_error: Error, _info: ErrorInfo) {}

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}

let mapsReady: Promise<void> | null = null;

function loadMapsAPI(): Promise<void> {
  if (mapsReady) return mapsReady;

  mapsReady = (async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(window as any).google?.maps) {
      const existing = document.querySelector(
        'script[src*="maps.googleapis.com/maps/api/js"]'
      );
      if (!existing) {
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}&v=alpha&libraries=maps3d,streetView`;
        script.async = true;
        document.head.appendChild(script);
      }

      const deadline = Date.now() + 15000;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      while (!(window as any).google?.maps?.importLibrary) {
        if (Date.now() > deadline) {
          throw new Error(
            "Google Maps API failed to initialize — ensure Maps JavaScript API and Map Tiles API are enabled in your GCP project."
          );
        }
        await new Promise((r) => setTimeout(r, 100));
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (window as any).google.maps.importLibrary("maps3d");
  })();

  mapsReady.catch(() => {
    mapsReady = null;
  });

  return mapsReady;
}

export default function MapView() {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMapsAPI()
      .then(() => setLoaded(true))
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/80">
        <ErrorState message={error} />
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="w-full h-full bg-muted/80 flex items-center justify-center">
        <div className="space-y-3 w-48">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return <Map3DInner />;
}

function Map3DInner() {
  const defaultCamera = {
    center: {
      lat: CAMPUS_CENTER.lat,
      lng: CAMPUS_CENTER.lng,
      altitude: 300,
    },
    range: 800,
    tilt: 55,
    heading: 0,
    roll: 0,
  };
  const mapRef = useRef<Map3DRef>(null);
  const lastCameraRef = useRef(defaultCamera);
  const previousStreetViewRef = useRef(false);
  const lastMapClickRef = useRef<{
    timestamp: number;
    position: { lat: number; lng: number } | null;
  }>({ timestamp: 0, position: null });
  const flyToTarget = useAppStore((s) => s.flyToTarget);
  const setFlyToTarget = useAppStore((s) => s.setFlyToTarget);
  const routeInfo = useAppStore((s) => s.routeInfo);
  const mapEventMarkers = useAppStore((s) => s.mapEventMarkers);
  const setSelectedPOI = useAppStore((s) => s.setSelectedPOI);
  const selectedPOI = useAppStore((s) => s.selectedPOI);
  const selectedDestination = useAppStore((s) => s.selectedDestination);
  const highlightedEventIds = useAppStore((s) => s.highlightedEventIds);
  const setSelectedEvent = useAppStore((s) => s.setSelectedEvent);
  const streetViewEvent = useAppStore((s) => s.streetViewEvent);
  const setStreetViewEvent = useAppStore((s) => s.setStreetViewEvent);
  const [inStreetView, setInStreetView] = useState(false);
  const [streetViewLocation, setStreetViewLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [mapViewCamera, setMapViewCamera] = useState(defaultCamera);

  useEffect(() => {
    if (!flyToTarget || !mapRef.current) return;
    mapRef.current.flyCameraTo({
      endCamera: {
        center: {
          lat: flyToTarget.lat,
          lng: flyToTarget.lng,
          altitude: flyToTarget.altitude || 200,
        },
        range: 400,
        tilt: 60,
        heading: 0,
      },
      durationMillis: 2000,
    });
    setFlyToTarget(null);
  }, [flyToTarget, setFlyToTarget]);

  // Save camera state when entering street view, restore when exiting
  useEffect(() => {
    const isNowInStreetView = inStreetView && !!streetViewLocation;
    if (isNowInStreetView && !previousStreetViewRef.current) {
      // Entering street view — snapshot camera
      const currentMap = mapRef.current?.map3d;
      if (
        currentMap?.center &&
        typeof currentMap.range === "number" &&
        typeof currentMap.tilt === "number" &&
        typeof currentMap.heading === "number" &&
        typeof currentMap.roll === "number"
      ) {
        lastCameraRef.current = {
          center: currentMap.center,
          range: currentMap.range,
          tilt: currentMap.tilt,
          heading: currentMap.heading,
          roll: currentMap.roll,
        };
      }
    }
    previousStreetViewRef.current = isNowInStreetView;
  }, [inStreetView, streetViewLocation]);

  const handleCameraChanged = useCallback((event: Map3DCameraChangedEvent) => {
    lastCameraRef.current = event.detail;
  }, []);

  const handleCloseStreetView = useCallback(() => {
    setMapViewCamera(lastCameraRef.current);
    setInStreetView(false);
    setStreetViewEvent(null);
  }, [setStreetViewEvent]);

  const handleMapClick = useCallback((e: Map3DClickEvent) => {
    const now = Date.now();
    const positionFromEvent = e.detail.position
      ? { lat: e.detail.position.lat, lng: e.detail.position.lng }
      : null;
    const streetViewTarget =
      positionFromEvent ??
      lastMapClickRef.current.position ?? {
        lat: CAMPUS_CENTER.lat,
        lng: CAMPUS_CENTER.lng,
      };

    if (now - lastMapClickRef.current.timestamp <= 300) {
      setStreetViewLocation(streetViewTarget);
      setInStreetView(true);
    }

    lastMapClickRef.current = {
      timestamp: now,
      position: positionFromEvent ?? lastMapClickRef.current.position,
    };
  }, []);

  const handleMarkerClick = useCallback(
    (poi: POI) => {
      setSelectedPOI(poi);
    },
    [setSelectedPOI]
  );

  const handleEventMarkerClick = useCallback(
    (event: CampusEvent) => {
      setSelectedEvent(event);
    },
    [setSelectedEvent]
  );

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (streetViewEvent && streetViewEvent.type !== "Online") {
      const timeoutId = window.setTimeout(() => {
        setStreetViewLocation({ lat: streetViewEvent.lat, lng: streetViewEvent.lng });
        setInStreetView(true);
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [streetViewEvent]);

  return (
    <div className="w-full h-full relative">
      {inStreetView && streetViewLocation ? (
        <StreetViewPanel
          location={streetViewLocation}
          onClose={handleCloseStreetView}
          eventInfo={streetViewEvent ?? undefined}
        />
      ) : (
        <>
          <Map3D
            ref={mapRef}
            mode="SATELLITE"
            defaultCenter={mapViewCamera.center}
            defaultRange={mapViewCamera.range}
            defaultTilt={mapViewCamera.tilt}
            defaultHeading={mapViewCamera.heading}
            defaultRoll={mapViewCamera.roll}
            onCameraChanged={handleCameraChanged}
            onClick={handleMapClick}
          >
            {CAMPUS_POIS.map((poi) => {
              const isSelected =
                selectedPOI?.id === poi.id ||
                selectedDestination?.id === poi.id;
              return (
                <Marker3D
                  key={poi.id}
                  position={{ lat: poi.lat, lng: poi.lng, altitude: 20 }}
                  altitudeMode="RELATIVE_TO_GROUND"
                  label={poi.name}
                  title={poi.name}
                  onClick={() => handleMarkerClick(poi)}
                >
                  <PinErrorBoundary>
                    <Pin
                      background={
                        isSelected
                          ? "#003B5C"
                          : poi.category === "Building"
                            ? "#003B5C"
                            : "#DA291C"
                      }
                      borderColor={
                        isSelected
                          ? "#DA291C"
                          : poi.category === "Building"
                            ? "#FFD700"
                            : "#003B5C"
                      }
                      glyphColor={
                        isSelected || poi.category === "Building"
                          ? "#fff"
                          : undefined
                      }
                      scale={
                        isSelected
                          ? 1.4
                          : poi.category === "Building"
                            ? 1.2
                            : 1.0
                      }
                    />
                  </PinErrorBoundary>
                </Marker3D>
              );
            })}

            {mapEventMarkers.map((event: CampusEvent) => {
              const isHighlighted = highlightedEventIds.includes(event.id);
              return (
                <Marker3D
                  key={event.id}
                  position={{ lat: event.lat, lng: event.lng, altitude: 25 }}
                  altitudeMode="RELATIVE_TO_GROUND"
                  label={event.title}
                  title={event.title}
                  onClick={() => handleEventMarkerClick(event)}
                >
                  <PinErrorBoundary>
                    <Pin
                      background={isHighlighted ? "#D97706" : "#F59E0B"}
                      borderColor={isHighlighted ? "#003B5C" : undefined}
                      glyphColor={isHighlighted ? "#fff" : undefined}
                      scale={isHighlighted ? 1.3 : 0.9}
                    />
                  </PinErrorBoundary>
                </Marker3D>
              );
            })}

            {routeInfo && routeInfo.polyline.length > 0 && <RoutePolyline />}
          </Map3D>

          <output aria-label="Street View hint" className="absolute bottom-36 md:bottom-3 right-3 z-10 text-xs text-white/90 bg-black/50 backdrop-blur-lg border border-white/10 px-3 py-1.5 rounded-xl pointer-events-none animate-in fade-in duration-500">
            Double-click to enter Street View
          </output>
        </>
      )}
    </div>
  );
}
