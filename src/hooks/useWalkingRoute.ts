"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/store/app-store";
import type { POI } from "@/types";

const SUSS_CAMPUS = { lat: 1.3299, lng: 103.7764 };

export function useWalkingRoute() {
  const setRouteInfo = useAppStore((s) => s.setRouteInfo);
  const setSelectedDestination = useAppStore((s) => s.setSelectedDestination);
  const setFlyToTarget = useAppStore((s) => s.setFlyToTarget);
  const setUserLocation = useAppStore((s) => s.setUserLocation);
  const userLocation = useAppStore((s) => s.userLocation);
  const [isLoading, setIsLoading] = useState(false);

  const walkTo = useCallback(
    async (destination: POI) => {
      setIsLoading(true);
      setSelectedDestination(destination);
      setFlyToTarget({
        lat: destination.lat,
        lng: destination.lng,
        altitude: 400,
      });

      const getLocation = (): Promise<{ lat: number; lng: number }> => {
        if (userLocation) return Promise.resolve(userLocation);
        return new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) =>
              resolve({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
              }),
            reject,
            { enableHighAccuracy: true, timeout: 10000 }
          );
        });
      };

      try {
        const origin = await getLocation();
        setUserLocation(origin);

        const { computeWalkingRoute } = await import(
          "@/lib/maps/route-utils"
        );
        const route = await computeWalkingRoute(origin, destination);
        if (route) {
          setRouteInfo({
            polyline: route.polyline,
            distanceMeters: route.distanceMeters,
            duration: route.durationText,
            steps: route.steps,
          });
          toast.success(
            `${route.durationText} · ${Math.round(route.distanceMeters)}m`
          );
        }
      } catch {
        const { computeWalkingRoute } = await import(
          "@/lib/maps/route-utils"
        );
        const route = await computeWalkingRoute(
          SUSS_CAMPUS,
          destination
        );
        if (route) {
          setRouteInfo({
            polyline: route.polyline,
            distanceMeters: route.distanceMeters,
            duration: route.durationText,
            steps: route.steps,
          });
          toast.info("Showing route from SUSS campus (location access denied)");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [
      userLocation,
      setRouteInfo,
      setSelectedDestination,
      setFlyToTarget,
      setUserLocation,
    ]
  );

  return { walkTo, isLoading };
}
