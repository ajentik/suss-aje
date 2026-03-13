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
      {/* Desktop: top-right with label. Mobile: FAB above sheet */}
      <button
        type="button"
        aria-label="Aerial flyover"
        onClick={handleClick}
        disabled={loading}
        className="absolute z-10 flex items-center justify-center gap-2 bg-card/80 backdrop-blur-xl border border-border/30 shadow-lg text-card-foreground hover:bg-card/95 active:scale-95 transition-all duration-200 disabled:opacity-50 animate-control-fade-in md:top-[max(1rem,env(safe-area-inset-top,1rem))] md:right-3 md:px-3.5 md:min-h-[44px] md:rounded-xl md:text-xs md:font-medium right-3 w-11 h-11 rounded-full"
        style={{
          bottom: "calc(var(--sheet-height, 64px) + 16px)",
        }}
      >
        <Plane size={18} aria-hidden="true" />
        <span className="hidden md:inline">
          {loading ? "Loading\u2026" : "Aerial View"}
        </span>
      </button>

      {/* Aerial video overlay */}
      {showVideo && videoUrl && (
        <FocusTrap active={showVideo}>
          <div
            role="dialog"
            aria-label="Aerial flyover video"
            className="absolute inset-0 z-30 bg-black/90 flex items-center justify-center"
            style={{
              paddingTop: "env(safe-area-inset-top, 0px)",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
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
                className="absolute top-3 right-3 flex items-center justify-center w-11 h-11 bg-white/20 hover:bg-white/30 active:scale-95 rounded-full text-white transition-all duration-200"
                style={{ marginTop: "env(safe-area-inset-top, 0px)" }}
              >
                <X size={20} />
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
