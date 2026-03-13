"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { lookupAerialVideo } from "@/lib/maps/aerial-view";

const SUSS_ADDRESS = "Singapore University of Social Sciences, 463 Clementi Road, Singapore 599494";

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
    return () => { cancelled = true; };
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
      <div
        className={`absolute inset-0 bg-primary transition-opacity duration-[2000ms] pointer-events-none ${
          videoReady ? "opacity-0" : "opacity-100"
        }`}
      />

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

      <div className="absolute inset-x-0 top-0 h-[30%] bg-gradient-to-b from-black/25 to-transparent pointer-events-none" />

      <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-black/60 via-black/15 to-transparent pointer-events-none" />

      <div className="relative z-10 text-center px-6 max-w-xl">
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

        <div className="flex justify-center mb-5 animate-hero-fade-in [animation-delay:500ms]">
          <div className="h-px bg-white/50 animate-hero-line-expand [animation-delay:600ms]" />
        </div>

        <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 tracking-tight drop-shadow-lg animate-hero-fade-in-up [animation-delay:600ms]">
          Campus Intelligent Assistant
        </h1>

        <p className="text-white/90 text-sm md:text-base mb-10 leading-relaxed drop-shadow animate-hero-fade-in-up [animation-delay:800ms]">
          Resolve campus affairs with one sentence. Navigate, discover events,
          and explore SUSS in 3D.
        </p>

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
      </div>
    </header>
  );
}
