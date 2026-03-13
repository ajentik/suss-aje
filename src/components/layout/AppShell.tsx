"use client";

import { useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/store/app-store";
import ChatPanel from "@/components/chat/ChatPanel";
import EventsPanel from "@/components/events/EventsPanel";
import RouteOverlay from "@/components/map/RouteOverlay";
import AerialViewButton from "@/components/map/AerialViewButton";

const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-muted flex items-center justify-center">
      <p className="text-muted-foreground text-sm">Loading 3D map...</p>
    </div>
  ),
});

export default function AppShell() {
  const activePanel = useAppStore((s) => s.activePanel);
  const setActivePanel = useAppStore((s) => s.setActivePanel);
  const ttsEnabled = useAppStore((s) => s.ttsEnabled);
  const setTtsEnabled = useAppStore((s) => s.setTtsEnabled);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(true);

  return (
    <div className="h-dvh w-full flex flex-col md:flex-row overflow-hidden">
      {/* Left Panel — Chat/Events (Desktop: sidebar, Mobile: bottom sheet) */}
      <div
        className={`
          md:w-[400px] md:h-full md:relative md:border-r md:flex md:flex-col
          fixed bottom-0 left-0 right-0 z-30
          ${mobileSheetOpen ? "h-[55dvh]" : "h-12"}
          md:h-full
          bg-background transition-all duration-300
          flex flex-col
          rounded-t-2xl md:rounded-none shadow-[0_-4px_12px_rgba(0,0,0,0.1)] md:shadow-none
        `}
      >
        {/* Mobile drag handle */}
        <button
          className="md:hidden flex justify-center py-2 shrink-0"
          onClick={() => setMobileSheetOpen(!mobileSheetOpen)}
        >
          <div className="w-8 h-1 rounded-full bg-muted-foreground/30" />
        </button>

        {/* Header - SUSS branded */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b bg-[#003B5C] text-white shrink-0 md:rounded-none rounded-t-2xl">
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
            <span className="text-xs font-semibold tracking-wide opacity-90">AJE</span>
          </div>
          <button
            onClick={() => setTtsEnabled(!ttsEnabled)}
            className="flex items-center justify-center w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white/80 hover:text-white"
            title={ttsEnabled ? "Disable voice" : "Enable voice"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {ttsEnabled ? (
                <>
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </>
              ) : (
                <>
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </>
              )}
            </svg>
          </button>
        </div>

        <Tabs
          value={activePanel}
          onValueChange={(v) => setActivePanel(v as "chat" | "events")}
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="mx-3 mt-2 shrink-0">
            <TabsTrigger value="chat" className="flex-1">Chat</TabsTrigger>
            <TabsTrigger value="events" className="flex-1">Events</TabsTrigger>
          </TabsList>
          <TabsContent value="chat" className="flex-1 min-h-0 mt-0">
            <ChatPanel />
          </TabsContent>
          <TabsContent value="events" className="flex-1 min-h-0 mt-0">
            <EventsPanel />
          </TabsContent>
        </Tabs>
      </div>

      {/* Right Panel — 3D Map */}
      <div className="flex-1 h-full relative">
        <MapView />
        <RouteOverlay />
        <AerialViewButton />
      </div>
    </div>
  );
}
