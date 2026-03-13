"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { lookupAerialVideo } from "@/lib/maps/aerial-view";

const SUSS_ADDRESS =
  "Singapore University of Social Sciences, 463 Clementi Road, Singapore 599494";

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <title>3D Map</title>
        <path d="m3 11 19-9-9 19-2-8Z" />
        <path d="M11 13 3 11" />
      </svg>
    ),
    label: "3D Campus Map",
    desc: "Explore SUSS in photorealistic 3D",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <title>Street View</title>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
      </svg>
    ),
    label: "Street View",
    desc: "Walk through campus & indoor spaces",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <title>AI Chat</title>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    label: "AI Chat & Voice",
    desc: "Ask SUSSi anything about campus",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <title>Events</title>
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
        <line x1="16" x2="16" y1="2" y2="6" />
        <line x1="8" x2="8" y1="2" y2="6" />
        <line x1="3" x2="21" y1="10" y2="10" />
      </svg>
    ),
    label: "Events & Navigation",
    desc: "Discover events, navigate to venues",
  },
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
        const pct =
          (video.buffered.end(video.buffered.length - 1) / video.duration) *
          100;
        setProgress(pct);
      }
    };
    video.addEventListener("progress", updateProgress);
    video.addEventListener("loadeddata", updateProgress);
    return () => {
      video.removeEventListener("progress", updateProgress);
      video.removeEventListener("loadeddata", updateProgress);
    };
  }, [videoUrl]);

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
      {/* Gradient fallback */}
      <div
        className={`absolute inset-0 bg-primary transition-opacity duration-[2000ms] pointer-events-none ${
          videoReady ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* Radial glow accents */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_40%,rgba(99,102,241,0.15)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,rgba(20,184,166,0.1)_0%,transparent_60%)] pointer-events-none" />

      {/* Loading progress */}
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

      {/* Aerial video background */}
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

      {/* Overlay gradients */}
      <div className="absolute inset-x-0 top-0 h-[30%] bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-2xl">
        {/* SUSS Logo */}
        <div className="mb-4 animate-hero-fade-in-up [animation-delay:300ms]">
          <Image
            src="/suss-logo.png"
            alt="SUSS — Singapore University of Social Sciences"
            width={200}
            height={70}
            className="mx-auto h-14 md:h-16 w-auto brightness-0 invert drop-shadow-lg"
            priority
          />
        </div>

        {/* Divider */}
        <div className="flex justify-center mb-4 animate-hero-fade-in [animation-delay:500ms]">
          <div className="h-px bg-white/40 animate-hero-line-expand [animation-delay:600ms]" />
        </div>

        {/* Brand name */}
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-2 tracking-tight drop-shadow-lg animate-hero-fade-in-up [animation-delay:600ms]">
          AskSUSSi
        </h1>

        {/* Tagline */}
        <p className="text-white/80 text-sm md:text-base mb-8 leading-relaxed drop-shadow animate-hero-fade-in-up [animation-delay:800ms]">
          Resolve campus affairs with one sentence. Navigate, discover events,
          and explore SUSS in 3D.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2.5 mb-10 animate-hero-fade-in-up [animation-delay:900ms]">
          {FEATURES.map((f) => (
            <div
              key={f.label}
              className="group flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white/85 text-xs md:text-sm hover:bg-white/15 transition-colors cursor-default"
              title={f.desc}
            >
              <span className="text-white/70 group-hover:text-white transition-colors">
                {f.icon}
              </span>
              <span>{f.label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="animate-hero-fade-in-up [animation-delay:1100ms]">
          <button
            type="button"
            aria-label="Enter AskSUSSi campus assistant"
            onClick={handleEnter}
            className="inline-flex items-center gap-2.5 px-10 py-3.5 bg-white text-primary rounded-full font-semibold text-base shadow-lg shadow-white/20 hover:bg-white/95 hover:shadow-xl hover:shadow-white/30 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <ArrowRight size={20} aria-hidden="true" />
            Explore Campus
          </button>
        </div>
      </div>

      {/* Bottom label */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-white/25 text-[10px] tracking-[0.2em] uppercase animate-hero-fade-in [animation-delay:1400ms]">
        SUSS Campus Intelligent Assistant
      </div>
    </header>
  );
}
