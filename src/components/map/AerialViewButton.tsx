"use client";

import { useState, useCallback } from "react";
import { useAppStore } from "@/store/app-store";
import { lookupAerialVideo } from "@/lib/maps/aerial-view";

export default function AerialViewButton() {
  const selectedDestination = useAppStore((s) => s.selectedDestination);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const handleClick = useCallback(async () => {
    if (!selectedDestination) return;

    setLoading(true);
    const address = `${selectedDestination.name}, 463 Clementi Road, Singapore 599494`;
    const video = await lookupAerialVideo(address);

    if (video?.uris) {
      const url =
        video.uris["VIDEO_MP4_HIGH"] ||
        video.uris["VIDEO_MP4_MEDIUM"] ||
        Object.values(video.uris)[0];
      if (url) {
        setVideoUrl(url);
        setShowVideo(true);
      }
    }
    setLoading(false);
  }, [selectedDestination]);

  if (!selectedDestination) return null;

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-2 bg-white/95 backdrop-blur rounded-lg shadow-lg text-xs font-medium hover:bg-white transition-colors disabled:opacity-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
        </svg>
        {loading ? "Loading..." : "Aerial View"}
      </button>

      {/* Aerial video overlay */}
      {showVideo && videoUrl && (
        <div className="absolute inset-0 z-30 bg-black/90 flex items-center justify-center">
          <div className="relative w-full h-full max-w-4xl max-h-[80vh] m-auto">
            <video
              autoPlay
              controls
              className="w-full h-full object-contain"
              onEnded={() => setShowVideo(false)}
            >
              <source src={videoUrl} type="video/mp4" />
            </video>
            <button
              onClick={() => setShowVideo(false)}
              className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
            <p className="absolute bottom-4 left-4 text-white/60 text-xs">
              Aerial flyover of {selectedDestination.name}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
