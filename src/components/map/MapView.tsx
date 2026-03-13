"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Map3D, Marker3D, Pin } from "@vis.gl/react-google-maps";
import type { Map3DRef, Map3DClickEvent } from "@vis.gl/react-google-maps";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/store/app-store";
import { CAMPUS_CENTER, CAMPUS_POIS } from "@/lib/maps/campus-pois";
import type { POI, CampusEvent } from "@/types";
import RoutePolyline from "./RoutePolyline";
import StreetViewPanel from "./StreetViewPanel";

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
  const mapRef = useRef<Map3DRef>(null);
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
  const [inStreetView, setInStreetView] = useState(false);
  const [streetViewLocation, setStreetViewLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

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

  return (
    <div className="w-full h-full relative">
      {inStreetView && streetViewLocation ? (
        <StreetViewPanel
          location={streetViewLocation}
          onClose={() => setInStreetView(false)}
        />
      ) : (
        <>
          <Map3D
            ref={mapRef}
            mode="SATELLITE"
            defaultCenter={{
              lat: CAMPUS_CENTER.lat,
              lng: CAMPUS_CENTER.lng,
              altitude: 300,
            }}
            defaultRange={800}
            defaultTilt={55}
            defaultHeading={0}
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
                  <Pin
                    background={isSelected ? "#003B5C" : "#DA291C"}
                    borderColor={isSelected ? "#DA291C" : "#003B5C"}
                    glyphColor={isSelected ? "#fff" : undefined}
                    scale={isSelected ? 1.4 : 1.0}
                  />
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
                  onClick={() =>
                    setFlyToTarget({ lat: event.lat, lng: event.lng })
                  }
                >
                  <Pin
                    background={isHighlighted ? "#D97706" : "#F59E0B"}
                    borderColor={isHighlighted ? "#003B5C" : undefined}
                    glyphColor={isHighlighted ? "#fff" : undefined}
                    scale={isHighlighted ? 1.3 : 0.9}
                  />
                </Marker3D>
              );
            })}

            {routeInfo && routeInfo.polyline.length > 0 && <RoutePolyline />}
          </Map3D>

          <output aria-label="Street View hint" className="absolute bottom-3 right-3 z-10 text-[10px] text-white/80 bg-black/40 backdrop-blur px-2 py-1 rounded pointer-events-none">
            Double-click to enter Street View
          </output>
        </>
      )}
    </div>
  );
}
