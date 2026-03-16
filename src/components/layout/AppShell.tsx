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
  Building2,
  // SquarePen — hidden for senior UX
  // Sun, Moon — theme toggle hidden for senior UX
} from "lucide-react";
// import { useTheme } from "next-themes"; — theme toggle hidden for senior UX
import { APIProvider } from "@vis.gl/react-google-maps";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore, type PanelId } from "@/store/app-store";
import ChatPanel from "@/components/chat/ChatPanel";
import EventsPanel from "@/components/events/EventsPanel";
import AACSearchPanel from "@/components/aac/AACSearchPanel";
import RouteOverlay from "@/components/map/RouteOverlay";
import AerialViewButton from "@/components/map/AerialViewButton";
import POIPopup, { POIDetailCard } from "@/components/map/POIPopup";
import EventPopup, { EventDetailCard } from "@/components/map/EventPopup";
import Onboarding from "@/components/layout/Onboarding";
import SOSButton from "@/components/senior/SOSButton";
import { MobileSheet, type SnapName } from "@/components/layout/MobileSheet";
import { createStreetViewEventFromPOI } from "@/lib/maps/poi-utils";

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
type MobileSheetState = "collapsed" | "peek" | "expanded";

function BrandHeader({
  ttsEnabled,
  onToggleTts,
  extraButtons,
}: {
  ttsEnabled: boolean;
  onToggleTts: () => void;
  onNewChat?: () => void;
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
        {/* Feedback / New-chat button hidden for senior UX
        {onNewChat && (
          <button
            type="button"
            onClick={onNewChat}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/25 transition-colors text-white/80 hover:text-white"
            title="New chat"
            aria-label="New chat"
          >
            <SquarePen size={18} />
          </button>
        )}
        */}
        {/* Theme toggle removed — forcing light mode (handled externally)
        {mounted && (
          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/25 transition-colors text-white/80 hover:text-white"
            title={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        )}
        */}
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
  const newChat = useAppStore((s) => s.newChat);
  const mobileSheet = useAppStore((s) => s.mobileSheetState);
  const setMobileSheet = useAppStore((s) => s.setMobileSheetState);
  const sheetContentMode = useAppStore((s) => s.sheetContentMode);
  const setSheetContentMode = useAppStore((s) => s.setSheetContentMode);
  const selectedPOI = useAppStore((s) => s.selectedPOI);
  const selectedEvent = useAppStore((s) => s.selectedEvent);
  const setSelectedPOI = useAppStore((s) => s.setSelectedPOI);
  const setSelectedEvent = useAppStore((s) => s.setSelectedEvent);
  const setSelectedDestination = useAppStore((s) => s.setSelectedDestination);
  const setStreetViewEvent = useAppStore((s) => s.setStreetViewEvent);

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
  }, []);

  const handleSnapChange = useCallback((snap: SnapName) => {
    const mapping: Record<SnapName, MobileSheetState> = {
      mini: "collapsed",
      peek: "peek",
      half: "expanded",
      full: "expanded",
    };
    setMobileSheet(mapping[snap]);
  }, [setMobileSheet]);

  const mobileSnapToRef = useRef<((snap: SnapName) => void) | null>(null);

  useEffect(() => {
    const mapping: Record<MobileSheetState, SnapName> = {
      collapsed: "mini",
      peek: "peek",
      expanded: "half",
    };
    mobileSnapToRef.current?.(mapping[mobileSheet]);
  }, [mobileSheet]);

  const toggleTts = useCallback(
    () => setTtsEnabled(!ttsEnabled),
    [ttsEnabled, setTtsEnabled],
  );

  // Close detail and return to default sheet content
  const handleCloseDetail = useCallback(() => {
    setSheetContentMode("default");
    setSelectedPOI(null);
    setSelectedEvent(null);
    setMobileSheet("expanded");
  }, [setSheetContentMode, setSelectedPOI, setSelectedEvent, setMobileSheet]);

  // Handle navigate from detail cards
  const handleNavigatePOI = useCallback(() => {
    if (selectedPOI) {
      setSelectedDestination(selectedPOI);
      setStreetViewEvent(createStreetViewEventFromPOI(selectedPOI));
    }
    setSelectedPOI(null);
    setSheetContentMode("default");
  }, [selectedPOI, setSelectedDestination, setStreetViewEvent, setSelectedPOI, setSheetContentMode]);

  const handleNavigateEvent = useCallback(() => {
    if (selectedEvent && selectedEvent.type !== "Online") {
      setStreetViewEvent(selectedEvent);
    }
    setSelectedEvent(null);
    setSheetContentMode("default");
  }, [selectedEvent, setStreetViewEvent, setSelectedEvent, setSheetContentMode]);

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

  useEffect(() => {
    const heightMap: Record<string, string> = {
      collapsed: "64px",
      peek: sheetContentMode !== "default" ? "280px" : "140px",
      expanded: "75dvh",
    };
    document.documentElement.style.setProperty(
      "--sheet-height",
      heightMap[mobileSheet] ?? "64px"
    );
  }, [mobileSheet, sheetContentMode]);

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
          onNewChat={newChat}
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
          onValueChange={(v) => setActivePanel(v as PanelId)}
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="mx-3 mt-2 shrink-0">
            <TabsTrigger value="chat" className="flex-1">
              Chat
            </TabsTrigger>
            <TabsTrigger value="events" className="flex-1">
              Events
            </TabsTrigger>
            <TabsTrigger value="aac-search" className="flex-1">
              AAC
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
          <TabsContent
            value="aac-search"
            className="flex-1 min-h-0 mt-0 overflow-y-auto"
          >
            <AACSearchPanel />
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

      <MobileSheet
        onSnapChange={handleSnapChange}
        snapToRef={mobileSnapToRef}
        miniContent={
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
        }
      >
        {sheetContentMode === "poi-detail" && selectedPOI ? (
          <POIDetailCard
            poi={selectedPOI}
            onClose={handleCloseDetail}
            onNavigate={handleNavigatePOI}
            compact={mobileSheet === "peek"}
          />
        ) : sheetContentMode === "event-detail" && selectedEvent ? (
          <EventDetailCard
            event={selectedEvent}
            onClose={handleCloseDetail}
            onNavigate={handleNavigateEvent}
            compact={mobileSheet === "peek"}
          />
        ) : (
          <>
            <BrandHeader ttsEnabled={ttsEnabled} onToggleTts={toggleTts} onNewChat={newChat} />

            <Tabs
              value={activePanel}
              onValueChange={(v) => setActivePanel(v as PanelId)}
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
                <TabsTrigger
                  value="aac-search"
                  className="flex-1 min-h-[44px] text-sm gap-1.5 font-medium"
                >
                  <Building2 size={15} aria-hidden="true" />
                  AAC
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
              <TabsContent
                value="aac-search"
                className="flex-1 min-h-0 mt-0 overflow-y-auto"
              >
                <AACSearchPanel />
              </TabsContent>
            </Tabs>
          </>
        )}
      </MobileSheet>

      <APIProvider
        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
        version="beta"
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
      <SOSButton />
    </div>
  );
}
