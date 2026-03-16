"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { POI } from "@/types";

const STORAGE_KEY = "asksussi-my-aac";

/** Minimal shape persisted to localStorage. */
export interface MyAACData {
  name: string;
  lat: number;
  lng: number;
  address: string;
  phone?: string;
}

function poiToMyAAC(poi: POI): MyAACData {
  return {
    name: poi.name,
    lat: poi.lat,
    lng: poi.lng,
    address: poi.address ?? "",
    ...(poi.contact ? { phone: poi.contact } : {}),
  };
}

function readStorage(): MyAACData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "name" in parsed &&
      "lat" in parsed &&
      "lng" in parsed &&
      "address" in parsed
    ) {
      return parsed as MyAACData;
    }
    return null;
  } catch {
    return null;
  }
}

// ── External store for cross-component reactivity ─────────────
let listeners: Array<() => void> = [];

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void): () => void {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot(): MyAACData | null {
  return readStorage();
}

function getServerSnapshot(): MyAACData | null {
  return null;
}

export function useMyAAC() {
  const myAAC = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setMyAAC = useCallback((aac: POI) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(poiToMyAAC(aac)));
    emitChange();
  }, []);

  const clearMyAAC = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    emitChange();
  }, []);

  return { myAAC, setMyAAC, clearMyAAC };
}

export { STORAGE_KEY, poiToMyAAC };
