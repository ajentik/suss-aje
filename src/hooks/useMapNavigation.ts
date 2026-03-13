"use client";

import { useState, useCallback } from "react";
import { computeWalkingRoute, type RouteResult } from "@/lib/maps/route-utils";
import { CAMPUS_CENTER } from "@/lib/maps/campus-pois";
import type { POI } from "@/types";

const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export function useMapNavigation() {
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigateTo = useCallback(
    async (destination: POI, origin?: { lat: number; lng: number }) => {
      setIsLoading(true);
      setRoute(null);

      const from = origin || CAMPUS_CENTER;

      try {
        // Try to get user's actual location
        let userLocation = from;
        if (!origin && navigator.geolocation) {
          try {
            const pos = await new Promise<GeolocationPosition>(
              (resolve, reject) =>
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                  timeout: 3000,
                })
            );
            userLocation = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            };
          } catch {
            // Use campus center as fallback
          }
        }

        const result = await computeWalkingRoute(
          userLocation,
          { lat: destination.lat, lng: destination.lng },
          MAPS_API_KEY
        );

        setRoute(result);
        return result;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearRoute = useCallback(() => {
    setRoute(null);
  }, []);

  return { route, isLoading, navigateTo, clearRoute };
}
