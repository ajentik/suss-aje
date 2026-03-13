"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import {
  Volume2,
  VolumeX,
  Minus,
  Maximize2,
  GripVertical,
  MessageSquare,
  Calendar,
  ChevronUp,
} from "lucide-react";
import { APIProvider } from "@vis.gl/react-google-maps";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/store/app-store";
import ChatPanel from "@/components/chat/ChatPanel";
import EventsPanel from "@/components/events/EventsPanel";
import RouteOverlay from "@/components/map/RouteOverlay";
import AerialViewButton from "@/components/map/AerialViewButton";
import POIPopup from "@/components/map/POIPopup";
import EventPopup from "@/components/map/EventPopup";
import Onboarding from "@/components/layout/Onboarding";

const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-muted flex items-center justify-center">
      <p className="text-muted-foreground text-sm">Loading 3D map...</p>
    </div>
  ),
});

const MIN_WIDTH = 320;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 400;

function BrandHeader({
  ttsEnabled,
  onToggleTts,
  extraButtons,
}: {
  ttsEnabled: boolean;
  onToggleTts: () => void;
  extraButtons?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b bg-surface-brand/90 backdrop-blur text-surface-brand-foreground shrink-0">
      <div className="flex items-center gap-2.5">
        <Image
          src="/suss-logo.png"
          alt="SUSS"
          width={80}
          height={28}
          className="h-7 w-auto brightness-0 invert"
          priority
        />
        <div className="h-5 w-px bg-white/25" />
        <span className="text-sm font-bold tracking-wide opacity-90">
          AskSUSSi
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onToggleTts}
          className="flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/25 transition-colors text-white/80 hover:text-white"
          title={ttsEnabled ? "Disable voice" : "Enable voice"}
          aria-label={ttsEnabled ? "Disable voice" : "Enable voice"}
        >
          {ttsEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
        {extraButtons}
      </div>
    </div>
  );
}

export default function AppShell() {
  const activePanel = useAppStore((s) => s.activePanel);
  const setActivePanel = useAppStore((s) => s.setActivePanel);
  const ttsEnabled = useAppStore((s) => s.ttsEnabled);
  const setTtsEnabled = useAppStore((s) => s.setTtsEnabled);
  const [mobileSheet, setMobileSheet] = useState<
    "collapsed" | "peek" | "expanded"
  >("expanded");
  const [minimized, setMinimized] = useState(false);
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(DEFAULT_WIDTH);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      isResizing.current = true;
      startX.current =
        "touches" in e ? e.touches[0].clientX : e.clientX;
      startWidth.current = panelWidth;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [panelWidth],
  );

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [activePanel]);

  const cycleSheet = useCallback(() => {
    setMobileSheet((prev) =>
      prev === "collapsed"
        ? "peek"
        : prev === "peek"
          ? "expanded"
          : "collapsed",
    );
  }, []);

  // Mobile swipe gesture for bottom sheet
  const sheetTouchStartY = useRef(0);
  const sheetTouchCurrentY = useRef(0);
  const isSheetDragging = useRef(false);

  const handleSheetTouchStart = useCallback((e: React.TouchEvent) => {
    sheetTouchStartY.current = e.touches[0].clientY;
    sheetTouchCurrentY.current = e.touches[0].clientY;
    isSheetDragging.current = true;
  }, []);

  const handleSheetTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isSheetDragging.current) return;
    sheetTouchCurrentY.current = e.touches[0].clientY;
  }, []);

  const handleSheetTouchEnd = useCallback(() => {
    if (!isSheetDragging.current) return;
    isSheetDragging.current = false;
    const deltaY = sheetTouchCurrentY.current - sheetTouchStartY.current;
    const threshold = 40;

    if (deltaY < -threshold) {
      // Swipe up — expand
      setMobileSheet((prev) =>
        prev === "collapsed"
          ? "peek"
          : prev === "peek"
            ? "expanded"
            : "expanded",
      );
    } else if (deltaY > threshold) {
      // Swipe down — collapse
      setMobileSheet((prev) =>
        prev === "expanded"
          ? "peek"
          : prev === "peek"
            ? "collapsed"
            : "collapsed",
      );
    }
  }, []);

  const toggleTts = useCallback(
    () => setTtsEnabled(!ttsEnabled),
    [ttsEnabled, setTtsEnabled],
  );

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isResizing.current) return;
      const clientX =
        "touches" in e ? e.touches[0].clientX : e.clientX;
      const delta = clientX - startX.current;
      const newWidth = Math.min(
        MAX_WIDTH,
        Math.max(MIN_WIDTH, startWidth.current + delta),
      );
      setPanelWidth(newWidth);
    };

    const handleUp = () => {
      if (!isResizing.current) return;
      isResizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, []);

  return (
    <div className="h-dvh w-full flex flex-col md:flex-row overflow-hidden">
      {/* Desktop sidebar */}
      <aside
        aria-label="Chat and Events"
        style={{ width: minimized ? 0 : panelWidth }}
        className={`
          hidden md:flex md:flex-col md:relative md:h-full
          bg-background/80 backdrop-blur-xl border-r border-white/10
          transition-[width] duration-300 ease-in-out overflow-hidden shrink-0
        `}
      >
        <BrandHeader
          ttsEnabled={ttsEnabled}
          onToggleTts={toggleTts}
          extraButtons={
            <button
              type="button"
              onClick={() => setMinimized(true)}
              className="flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/25 transition-colors text-white/80 hover:text-white"
              title="Minimize panel"
              aria-label="Minimize panel"
            >
              <Minus size={14} />
            </button>
          }
        />

        {/* Tabs */}
        <Tabs
          value={activePanel}
          onValueChange={(v) => setActivePanel(v as "chat" | "events")}
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="mx-3 mt-2 shrink-0">
            <TabsTrigger value="chat" className="flex-1">
              Chat
            </TabsTrigger>
            <TabsTrigger value="events" className="flex-1">
              Events
            </TabsTrigger>
          </TabsList>
          <TabsContent value="chat" className="flex-1 min-h-0 mt-0">
            <ChatPanel />
          </TabsContent>
          <TabsContent
            value="events"
            className="flex-1 min-h-0 mt-0 overflow-y-auto"
          >
            <EventsPanel />
          </TabsContent>
        </Tabs>
      </aside>

      {/* Desktop resize handle */}
      {!minimized && (
        <button
          type="button"
          aria-label="Resize panel"
          className="hidden md:flex items-center justify-center w-3 px-2 -mx-2 cursor-col-resize hover:bg-primary/10 active:bg-primary/20 transition-colors group shrink-0 border-0 bg-transparent"
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
        >
          <GripVertical
            size={14}
            className="text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors"
          />
        </button>
      )}

      {/* Desktop minimize restore button */}
      {minimized && (
        <button
          type="button"
          onClick={() => setMinimized(false)}
          className="hidden md:flex absolute top-3 left-3 z-30 items-center gap-1.5 px-3 py-2 bg-surface-brand/90 backdrop-blur text-surface-brand-foreground rounded-lg shadow-lg text-xs font-medium hover:bg-surface-brand transition-colors"
          aria-label="Restore panel"
        >
          <Maximize2 size={14} />
          AskSUSSi
        </button>
      )}

      {/* Mobile bottom sheet */}
      <aside
        aria-label="Chat and Events (mobile)"
        className={`
          md:hidden fixed bottom-0 left-0 right-0 z-30
          ${mobileSheet === "expanded" ? "h-[75dvh]" : mobileSheet === "peek" ? "h-[140px]" : "h-16"}
          bg-background/95 backdrop-blur-xl
          transition-all duration-350 ease-[cubic-bezier(0.32,0.72,0,1)]
          flex flex-col overflow-hidden
          rounded-t-2xl shadow-[0_-4px_30px_rgba(0,0,0,0.1)]
          border-t border-border/50
        `}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {/* Drag handle area — swipeable */}
        <div
          role="button"
          tabIndex={0}
          aria-label={
            mobileSheet === "expanded" ? "Collapse panel" : "Expand panel"
          }
          className="flex flex-col items-center pt-2 pb-1.5 shrink-0 cursor-grab active:cursor-grabbing touch-none select-none"
          onClick={cycleSheet}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") cycleSheet();
          }}
          onTouchStart={handleSheetTouchStart}
          onTouchMove={handleSheetTouchMove}
          onTouchEnd={handleSheetTouchEnd}
        >
          <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30 mb-1" />
          {mobileSheet === "collapsed" && (
            <ChevronUp size={14} className="text-muted-foreground/40 animate-pulse" aria-hidden="true" />
          )}
        </div>

        {/* Collapsed state: show mini status */}
        {mobileSheet === "collapsed" && (
          <div className="flex items-center justify-between px-4 pb-2 shrink-0">
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10">
                <MessageSquare size={14} className="text-primary" aria-hidden="true" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-card-foreground text-[13px] leading-tight">AskSUSSi</span>
                <span className="text-[11px] text-muted-foreground/70">Swipe up to chat</span>
              </div>
            </div>
          </div>
        )}

        {mobileSheet !== "collapsed" && (
          <>
            <BrandHeader ttsEnabled={ttsEnabled} onToggleTts={toggleTts} />

            <Tabs
              value={activePanel}
              onValueChange={(v) =>
                setActivePanel(v as "chat" | "events")
              }
              className="flex-1 flex flex-col min-h-0"
            >
              <TabsList className="mx-3 mt-2 shrink-0 h-12">
                <TabsTrigger
                  value="chat"
                  className="flex-1 min-h-[44px] text-sm gap-1.5 font-medium"
                >
                  <MessageSquare size={15} aria-hidden="true" />
                  Chat
                </TabsTrigger>
                <TabsTrigger
                  value="events"
                  className="flex-1 min-h-[44px] text-sm gap-1.5 font-medium"
                >
                  <Calendar size={15} aria-hidden="true" />
                  Events
                </TabsTrigger>
              </TabsList>
              <TabsContent value="chat" className="flex-1 min-h-0 mt-0">
                <ChatPanel />
              </TabsContent>
              <TabsContent
                value="events"
                className="flex-1 min-h-0 mt-0 overflow-y-auto"
              >
                <EventsPanel />
              </TabsContent>
            </Tabs>
          </>
        )}
      </aside>

      <APIProvider
        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
        version="alpha"
      >
        <main id="main-content" className="flex-1 h-full relative">
          <MapView />
          <RouteOverlay />
          <AerialViewButton />
          <POIPopup />
          <EventPopup />
        </main>
      </APIProvider>

      <Onboarding />
    </div>
  );
}
