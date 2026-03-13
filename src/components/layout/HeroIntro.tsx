"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { lookupAerialVideo } from "@/lib/maps/aerial-view";

const SUSS_ADDRESS = "463 Clementi Road, Singapore 599494";

interface HeroIntroProps {
  onEnter: () => void;
}

export default function HeroIntro({ onEnter }: HeroIntroProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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
    setTimeout(onEnter, 600);
  }, [onEnter]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#003B5C] transition-opacity duration-500 ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Background video */}
      {videoUrl && (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#003B5C] via-[#003B5C]/60 to-transparent" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-lg">
        {/* SUSS Logo */}
        <div className="mb-6">
          <Image
            src="/suss-logo.png"
            alt="SUSS — Singapore University of Social Sciences"
            width={200}
            height={70}
            className="mx-auto h-16 md:h-20 w-auto brightness-0 invert"
            priority
          />
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
          Campus Intelligent Assistant
        </h1>
        <p className="text-white/70 text-sm md:text-base mb-8 leading-relaxed">
          Resolve campus affairs with one sentence. Navigate, discover events, and explore SUSS in 3D.
        </p>

        <button
          onClick={handleEnter}
          className="inline-flex items-center gap-2 px-8 py-3 bg-white text-[#003B5C] rounded-full font-semibold text-sm hover:bg-white/90 transition-all hover:scale-105 active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
          Explore Campus
        </button>

        {loading && (
          <p className="text-white/40 text-xs mt-6">Loading aerial view...</p>
        )}

        {!loading && videoUrl && (
          <p className="text-white/40 text-xs mt-6">Aerial flyover powered by Google Maps</p>
        )}
      </div>
    </div>
  );
}
