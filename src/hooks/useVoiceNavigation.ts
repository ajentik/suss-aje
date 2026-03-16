"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import { haversineDistance } from "@/lib/maps/geo-utils";
import type { RouteStep } from "@/types";

/** Metres — user is considered to have reached the waypoint */
const ARRIVAL_THRESHOLD_M = 25;
/** Metres — beyond this distance from polyline, user is off-route */
const OFF_ROUTE_THRESHOLD_M = 50;
/** Metres — announce next instruction when within this distance */
const PRE_ANNOUNCE_DISTANCE_M = 50;
/** Milliseconds — minimum gap between voice announcements */
const ANNOUNCE_COOLDOWN_MS = 5000;

export interface VoiceNavigationState {
  isNavigating: boolean;
  currentStepIndex: number;
  distanceToNextMeters: number;
  isSpeaking: boolean;
  isOffRoute: boolean;
  voiceMuted: boolean;
  start: () => void;
  stop: () => void;
  toggleMute: () => void;
}

/** Shortest haversine distance (km) from a point to any vertex in a polyline */
function distanceToPolyline(
  lat: number,
  lng: number,
  polyline: { lat: number; lng: number }[],
): number {
  if (polyline.length === 0) return Infinity;
  let minDist = Infinity;
  for (let i = 0; i < polyline.length; i++) {
    const d = haversineDistance(lat, lng, polyline[i].lat, polyline[i].lng);
    if (d < minDist) minDist = d;
  }
  return minDist;
}

/**
 * Maps each route step to a polyline coordinate by interpolating cumulative
 * step distances onto cumulative polyline segment distances (Haversine).
 */
function buildStepWaypoints(
  steps: RouteStep[],
  polyline: { lat: number; lng: number }[],
): { lat: number; lng: number }[] {
  if (polyline.length === 0 || steps.length === 0) return [];

  const totalDistance = steps.reduce((sum, s) => sum + s.distanceMeters, 0);
  if (totalDistance === 0) return polyline.slice(0, steps.length);

  const waypoints: { lat: number; lng: number }[] = [];
  let cumulativeStepDist = 0;

  const polylineDists: number[] = [0];
  for (let i = 1; i < polyline.length; i++) {
    const segDist =
      haversineDistance(
        polyline[i - 1].lat,
        polyline[i - 1].lng,
        polyline[i].lat,
        polyline[i].lng,
      ) * 1000;
    polylineDists.push(polylineDists[i - 1] + segDist);
  }
  const totalPolylineDist = polylineDists[polylineDists.length - 1];

  for (const step of steps) {
    cumulativeStepDist += step.distanceMeters;
    const fraction =
      totalPolylineDist > 0 ? cumulativeStepDist / totalDistance : 0;
    const targetDist = fraction * totalPolylineDist;

    let bestIdx = polyline.length - 1;
    for (let j = 0; j < polylineDists.length; j++) {
      if (polylineDists[j] >= targetDist) {
        bestIdx = j;
        break;
      }
    }
    waypoints.push(polyline[bestIdx]);
  }

  return waypoints;
}

export function useVoiceNavigation(): VoiceNavigationState {
  const routeInfo = useAppStore((s) => s.routeInfo);

  const [isNavigating, setIsNavigating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [distanceToNextMeters, setDistanceToNextMeters] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isOffRoute, setIsOffRoute] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const lastAnnounceTimeRef = useRef(0);
  const lastAnnouncedStepRef = useRef(-1);
  const offRouteAnnouncedRef = useRef(false);
  const waypointsRef = useRef<{ lat: number; lng: number }[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voiceMutedRef = useRef(false);
  const currentStepIndexRef = useRef(0);
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    voiceMutedRef.current = voiceMuted;
  }, [voiceMuted]);

  useEffect(() => {
    currentStepIndexRef.current = currentStepIndex;
  }, [currentStepIndex]);

  useEffect(() => {
    isNavigatingRef.current = isNavigating;
  }, [isNavigating]);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (voiceMutedRef.current) return;

    const now = Date.now();
    if (now - lastAnnounceTimeRef.current < ANNOUNCE_COOLDOWN_MS) return;
    lastAnnounceTimeRef.current = now;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-SG";
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  const handlePosition = useCallback(
    (position: GeolocationPosition) => {
      if (!isNavigatingRef.current || !routeInfo) return;

      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;
      const steps = routeInfo.steps;
      const waypoints = waypointsRef.current;
      const stepIdx = currentStepIndexRef.current;

      if (waypoints.length === 0 || stepIdx >= steps.length) return;

      const distKm = haversineDistance(
        userLat,
        userLng,
        waypoints[stepIdx].lat,
        waypoints[stepIdx].lng,
      );
      const distM = distKm * 1000;
      setDistanceToNextMeters(Math.round(distM));

      const distToRouteKm = distanceToPolyline(
        userLat,
        userLng,
        routeInfo.polyline,
      );
      const distToRouteM = distToRouteKm * 1000;

      if (distToRouteM > OFF_ROUTE_THRESHOLD_M) {
        setIsOffRoute(true);
        if (!offRouteAnnouncedRef.current) {
          offRouteAnnouncedRef.current = true;
          speak("You appear to be off route. Please return to the path.");
        }
      } else {
        setIsOffRoute(false);
        offRouteAnnouncedRef.current = false;
      }

      if (distM <= ARRIVAL_THRESHOLD_M) {
        const nextIdx = stepIdx + 1;
        if (nextIdx < steps.length) {
          setCurrentStepIndex(nextIdx);
          currentStepIndexRef.current = nextIdx;
          lastAnnouncedStepRef.current = -1;
        } else {
          speak("You have arrived at your destination.");
          setTimeout(() => {
            if (isNavigatingRef.current) {
              setIsNavigating(false);
              isNavigatingRef.current = false;
              if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
              }
            }
          }, 2000);
          return;
        }
      }

      const activeIdx = currentStepIndexRef.current;
      if (
        distM <= PRE_ANNOUNCE_DISTANCE_M &&
        lastAnnouncedStepRef.current !== activeIdx
      ) {
        lastAnnouncedStepRef.current = activeIdx;
        const step = steps[activeIdx];
        const distText =
          distM < 10 ? "now" : `In ${Math.round(distM)} metres`;
        speak(`${distText}, ${step.instruction}`);
      }
    },
    [routeInfo, speak],
  );

  const start = useCallback(() => {
    if (!routeInfo || routeInfo.steps.length === 0) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    waypointsRef.current = buildStepWaypoints(
      routeInfo.steps,
      routeInfo.polyline,
    );

    setCurrentStepIndex(0);
    currentStepIndexRef.current = 0;
    setDistanceToNextMeters(0);
    setIsOffRoute(false);
    setIsNavigating(true);
    isNavigatingRef.current = true;
    lastAnnouncedStepRef.current = -1;
    offRouteAnnouncedRef.current = false;

    speak(`Navigation started. ${routeInfo.steps[0].instruction}`);

    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      () => {},
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 3000,
      },
    );
  }, [routeInfo, handlePosition, speak]);

  const stop = useCallback(() => {
    setIsNavigating(false);
    isNavigatingRef.current = false;
    setCurrentStepIndex(0);
    setDistanceToNextMeters(0);
    setIsOffRoute(false);

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const toggleMute = useCallback(() => {
    setVoiceMuted((prev) => {
      const next = !prev;
      voiceMutedRef.current = next;
      if (next && typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (!routeInfo && isNavigatingRef.current) {
      queueMicrotask(stop);
    }
  }, [routeInfo, stop]);

  return {
    isNavigating,
    currentStepIndex,
    distanceToNextMeters,
    isSpeaking,
    isOffRoute,
    voiceMuted,
    start,
    stop,
    toggleMute,
  };
}
