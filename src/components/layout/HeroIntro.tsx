"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { lookupAerialVideo } from "@/lib/maps/aerial-view";

const SUSS_ADDRESS = "463 Clementi Road, Singapore 599494";

interface HeroIntroProps {
  onEnter: () => void;
}

export default function HeroIntro({ onEnter }: HeroIntroProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    lookupAerialVideo(SUSS_ADDRESS).then((video) => {
      if (video?.uris) {
        const url =
          video.uris["VIDEO_MP4_HIGH"] ||
          video.uris["VIDEO_MP4_MEDIUM"] ||
          Object.values(video.uris)[0];
        setVideoUrl(url || null);
      }
      setLoading(false);
    });
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
      {/* Base background — navy, visible during load */}
      <div
        className={`absolute inset-0 bg-primary transition-opacity duration-[2000ms] pointer-events-none ${
          videoReady ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* Loading pulse indicator */}
      {loading && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-white/50 animate-hero-pulse-subtle" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/50 animate-hero-pulse-subtle [animation-delay:300ms]" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/50 animate-hero-pulse-subtle [animation-delay:600ms]" />
          </div>
        </div>
      )}

      {/* Aerial flyover video — THE hero background */}
      {videoUrl && (
        <video
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setVideoReady(true)}
          className={`absolute inset-0 w-full h-full object-cover scale-105 transition-opacity duration-[2000ms] ${
            videoReady ? "opacity-90" : "opacity-0"
          }`}
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      )}

      {/* Top vignette — subtle darkening for depth */}
      <div className="absolute inset-x-0 top-0 h-[30%] bg-gradient-to-b from-black/25 to-transparent pointer-events-none" />

      {/* Bottom scrim — ensures text readability without killing video */}
      <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-black/60 via-black/15 to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-xl">
        {/* SUSS Logo */}
        <div className="mb-5 animate-hero-fade-in-up [animation-delay:300ms]">
          <Image
            src="/suss-logo.png"
            alt="SUSS — Singapore University of Social Sciences"
            width={200}
            height={70}
            className="mx-auto h-16 md:h-20 w-auto brightness-0 invert drop-shadow-lg"
            priority
          />
        </div>

        {/* Separator line */}
        <div className="flex justify-center mb-5 animate-hero-fade-in [animation-delay:500ms]">
          <div className="h-px bg-white/50 animate-hero-line-expand [animation-delay:600ms]" />
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 tracking-tight drop-shadow-lg animate-hero-fade-in-up [animation-delay:600ms]">
          Campus Intelligent Assistant
        </h1>

        {/* Subtitle */}
        <p className="text-white/90 text-sm md:text-base mb-10 leading-relaxed drop-shadow animate-hero-fade-in-up [animation-delay:800ms]">
          Resolve campus affairs with one sentence. Navigate, discover events,
          and explore SUSS in 3D.
        </p>

        {/* CTA Button */}
        <div className="animate-hero-fade-in-up [animation-delay:1000ms]">
          <button
            type="button"
            aria-label="Enter campus assistant"
            onClick={handleEnter}
            className="inline-flex items-center gap-2.5 px-10 py-3.5 bg-white text-primary rounded-full font-semibold text-base shadow-lg shadow-white/20 hover:bg-white/95 hover:shadow-xl hover:shadow-white/30 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <ArrowRight size={20} aria-hidden="true" />
            Explore Campus
          </button>
        </div>

        {/* Attribution */}
        {!loading && videoUrl && (
          <p className="text-white/50 text-[10px] mt-8 tracking-wide uppercase animate-hero-fade-in [animation-delay:1200ms]">
            Aerial flyover powered by Google Maps
          </p>
        )}
      </div>
    </header>
  );
}
