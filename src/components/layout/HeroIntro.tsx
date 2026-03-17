"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { DooIcon, type IconName } from "@/lib/icons";
import { lookupAerialVideo } from "@/lib/maps/aerial-view";

const SUSS_ADDRESS =
  "Singapore University of Social Sciences, 463 Clementi Road, Singapore 599494";

const FEATURES: ReadonlyArray<{ icon: IconName; label: string; desc: string }> = [
  { icon: "navigation", label: "3D Campus Map", desc: "Explore SUSS in photorealistic 3D" },
  { icon: "globe", label: "Street View", desc: "Walk through campus & indoor spaces" },
  { icon: "message", label: "AI Chat & Voice", desc: "Ask SUSSi anything about campus" },
  { icon: "calendar", label: "Events & Navigation", desc: "Discover events, navigate to venues" },
];

interface HeroIntroProps {
  onEnter: () => void;
}

export default function HeroIntro({ onEnter }: HeroIntroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchAerialVideo() {
      try {
        const video = await lookupAerialVideo(SUSS_ADDRESS);
        if (cancelled) return;

        if (video?.uris) {
          const url =
            video.uris["VIDEO_MP4_HIGH"] ||
            video.uris["VIDEO_MP4_MEDIUM"] ||
            Object.values(video.uris)[0];
          if (url) {
            setVideoUrl(url);
            return;
          }
        }
        setVideoFailed(true);
      } catch {
        if (!cancelled) setVideoFailed(true);
      }
    }

    fetchAerialVideo();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const updateProgress = () => {
      if (video.buffered.length > 0 && video.duration > 0) {
        const pct = (video.buffered.end(video.buffered.length - 1) / video.duration) * 100;
        setProgress(pct);
      }
    };
    video.addEventListener("progress", updateProgress);
    video.addEventListener("loadeddata", updateProgress);
    return () => {
      video.removeEventListener("progress", updateProgress);
      video.removeEventListener("loadeddata", updateProgress);
    };
  }, []);

  const handleEnter = useCallback(() => {
    setFadeOut(true);
    setTimeout(onEnter, 700);
  }, [onEnter]);

  return (
    <header
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-700 ease-out ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-surface-brand animate-gradient-shift transition-opacity duration-[2000ms] pointer-events-none ${
          videoReady ? "opacity-0" : "opacity-100"
        }`}
      />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_40%,oklch(0.55_0.15_250_/_0.2)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,oklch(0.55_0.12_170_/_0.12)_0%,transparent_60%)] pointer-events-none" />

      {!videoFailed && !videoReady && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 w-48">
          <div className="h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/70 rounded-full transition-all duration-300"
              style={{ width: `${videoUrl ? progress : 30}%` }}
            />
          </div>
        </div>
      )}

      {videoUrl && (
        <video
          ref={videoRef}
          src={videoUrl}
          autoPlay
          loop
          muted
          playsInline
          crossOrigin="anonymous"
          onLoadedData={() => setVideoReady(true)}
          onError={() => setVideoFailed(true)}
          className={`absolute inset-0 w-full h-full object-cover scale-105 transition-opacity duration-[2000ms] ${
            videoReady ? "opacity-90" : "opacity-0"
          }`}
        />
      )}

      <div className="absolute inset-x-0 top-0 h-[30%] bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />

      <div className="relative z-10 text-center px-6 max-w-2xl">
        <div
          className="mb-4 opacity-0"
          style={{
            animation: "hero-fade-in-up 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) 300ms forwards",
          }}
        >
          <Image
            src="/suss-logo.png"
            alt="SUSS — Singapore University of Social Sciences"
            width={200}
            height={70}
            className="mx-auto h-14 md:h-16 w-auto brightness-0 invert drop-shadow-lg"
            priority
          />
        </div>

        <div className="flex justify-center mb-4 animate-hero-fade-in [animation-delay:500ms]">
          <div className="h-px bg-white/40 animate-hero-line-expand [animation-delay:600ms]" />
        </div>

        <h1
          className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-white/95 to-white/80 mb-2 tracking-wider drop-shadow-lg opacity-0"
          style={{
            animation: "hero-fade-in-up 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) 600ms forwards",
          }}
        >
          AskSUSSi
        </h1>

        <p className="text-white/80 text-sm md:text-base mb-8 leading-relaxed drop-shadow animate-hero-fade-in-up [animation-delay:800ms]">
          Resolve campus affairs with one sentence. Navigate, discover events,
          and explore SUSS in 3D.
        </p>

        <div className="flex flex-wrap justify-center gap-2.5 mb-10 animate-hero-fade-in-up [animation-delay:900ms]">
          {FEATURES.map((f) => (
            <div
              key={f.label}
              className="group flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white/85 text-xs md:text-sm hover:bg-white/15 transition-colors cursor-default"
              title={f.desc}
            >
              <DooIcon name={f.icon} size={16} className="text-white/70 group-hover:text-white transition-colors" />
              <span>{f.label}</span>
            </div>
          ))}
        </div>

        <div
          className="opacity-0"
          style={{
            animation: "hero-fade-in-up 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) 1100ms forwards",
          }}
        >
          <button
            type="button"
            aria-label="Enter AskSUSSi campus assistant"
            onClick={handleEnter}
            className="inline-flex items-center gap-2.5 px-10 h-14 bg-white text-primary rounded-full font-semibold text-base shadow-lg hover:bg-white/95 hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 animate-subtle-glow"
          >
            <DooIcon name="arrow-right" size={20} />
            Explore Campus
          </button>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-white/30 text-xs tracking-[0.2em] uppercase animate-hero-fade-in [animation-delay:1400ms]">
        SUSS Campus Intelligent Assistant
      </div>
    </header>
  );
}
