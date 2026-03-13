"use client";

import { useState, useCallback, useEffect } from "react";
import FocusTrap from "focus-trap-react";
import { Plane, X } from "lucide-react";
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

  useEffect(() => {
    if (!showVideo) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowVideo(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showVideo]);

  if (!selectedDestination) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Aerial flyover"
        onClick={handleClick}
        disabled={loading}
        className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-2 bg-white/95 backdrop-blur rounded-lg shadow-lg text-xs font-medium hover:bg-white transition-colors disabled:opacity-50"
      >
        <Plane size={14} />
        {loading ? "Loading..." : "Aerial View"}
      </button>

      {/* Aerial video overlay */}
      {showVideo && videoUrl && (
        <FocusTrap active={showVideo}>
          <div
            role="dialog"
            aria-label="Aerial flyover video"
            className="absolute inset-0 z-30 bg-black/90 flex items-center justify-center"
          >
            <div className="relative w-full h-full max-w-4xl max-h-[80vh] m-auto">
              <video
                autoPlay
                controls
                className="w-full h-full object-contain"
                onEnded={() => setShowVideo(false)}
              >
                <source src={videoUrl} type="video/mp4" />
                <track kind="captions" label="English captions" srcLang="en" />
              </video>
              <button
                type="button"
                aria-label="Close aerial view"
                onClick={() => setShowVideo(false)}
                className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
              >
                <X size={18} />
              </button>
              <p className="absolute bottom-4 left-4 text-white/60 text-xs">
                Aerial flyover of {selectedDestination.name}
              </p>
            </div>
          </div>
        </FocusTrap>
      )}
    </>
  );
}
