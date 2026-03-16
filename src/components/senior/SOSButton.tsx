"use client";

import { useState, useCallback, useEffect } from "react";

type SOSView = "closed" | "menu" | "locating";

const EMERGENCY_NUMBER = "995";

function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return Promise.resolve(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);

  return fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`,
  )
    .then((res) => res.json())
    .then((data: { results?: Array<{ formatted_address: string }> }) => {
      const addr = data.results?.[0]?.formatted_address;
      return addr ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    })
    .catch(() => `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
}

function mapsLink(lat: number, lng: number): string {
  return `https://maps.google.com/?q=${lat},${lng}`;
}

export default function SOSButton() {
  const [view, setView] = useState<SOSView>("closed");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by this browser.");
      return;
    }

    setLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLat = position.coords.latitude;
        const newLng = position.coords.longitude;
        setLat(newLat);
        setLng(newLng);
        setLocating(false);

        reverseGeocode(newLat, newLng).then(setAddress);
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError("Location access denied. Please enable it in settings.");
        } else {
          setGeoError("Unable to get location. Please try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  }, []);

  const handleOpen = useCallback(() => {
    setView("menu");
    setLat(null);
    setLng(null);
    setAddress(null);
    setGeoError(null);
    requestLocation();
  }, [requestLocation]);

  const handleClose = useCallback(() => {
    setView("closed");
  }, []);

  const handleShareLocation = useCallback(() => {
    if (lat === null || lng === null) return;

    const link = mapsLink(lat, lng);
    const message = `I need help. My location: ${link}`;

    if (navigator.share) {
      navigator.share({ title: "SOS - My Location", text: message }).catch(() => undefined);
    } else {
      window.open(`sms:?body=${encodeURIComponent(message)}`, "_self");
    }
  }, [lat, lng]);

  useEffect(() => {
    if (view === "closed") return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setView("closed");
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [view]);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 active:bg-red-800 shadow-lg shadow-red-600/30 transition-colors"
        aria-label="SOS Emergency"
      >
        <span className="text-white font-extrabold text-lg select-none">
          SOS
        </span>
      </button>

      {view !== "closed" && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="SOS Emergency options"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl p-6 flex flex-col gap-4">
            <h2 className="text-xl font-bold text-center text-red-600">
              Emergency Help
            </h2>

            <a
              href={`tel:${EMERGENCY_NUMBER}`}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-lg font-bold transition-colors"
            >
              <span aria-hidden="true">📞</span>
              Call Emergency ({EMERGENCY_NUMBER})
            </a>

            <button
              type="button"
              onClick={handleShareLocation}
              disabled={lat === null || lng === null}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span aria-hidden="true">📱</span>
              Share My Location with Family
            </button>

            <div className="w-full rounded-xl bg-neutral-100 dark:bg-neutral-800 p-4 text-center min-h-[60px] flex items-center justify-center">
              {locating && (
                <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                  📍 Getting your location...
                </p>
              )}
              {!locating && geoError && (
                <p className="text-red-500 text-sm">{geoError}</p>
              )}
              {!locating && !geoError && address && (
                <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                  <span aria-hidden="true">📍</span> I Am Here: {address}
                </p>
              )}
              {!locating && !geoError && !address && lat !== null && lng !== null && (
                <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                  <span aria-hidden="true">📍</span> I Am Here: {lat.toFixed(5)}, {lng.toFixed(5)}
                </p>
              )}
              {!locating && !geoError && !address && lat === null && (
                <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                  📍 Waiting for location...
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="w-full py-4 rounded-xl bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-900 dark:text-white text-lg font-bold transition-colors"
            >
              ✕ Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
