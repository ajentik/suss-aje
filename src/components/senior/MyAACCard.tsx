"use client";

import { Phone, Footprints, Calendar, Building2, ChevronRight, X } from "lucide-react";
import { useMyAAC } from "@/hooks/useMyAAC";
import { useWalkingRoute } from "@/hooks/useWalkingRoute";
import { useAppStore } from "@/store/app-store";
import type { POI } from "@/types";

function buildPOIFromMyAAC(data: { name: string; lat: number; lng: number; address: string; phone?: string }): POI {
  return {
    id: `my-aac-${data.lat}-${data.lng}`,
    name: data.name,
    lat: data.lat,
    lng: data.lng,
    category: "Active Ageing Centre",
    description: "Your saved Active Ageing Centre",
    address: data.address,
    contact: data.phone,
  };
}

export default function MyAACCard() {
  const { myAAC, clearMyAAC } = useMyAAC();
  const { walkTo, isLoading: isWalking } = useWalkingRoute();
  const setActivePanel = useAppStore((s) => s.setActivePanel);

  if (!myAAC) {
    return (
      <div className="mx-3 mt-3 rounded-xl border border-dashed border-border bg-muted/30 p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-poi-aac/15 flex items-center justify-center">
            <Building2 size={20} className="text-poi-aac" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Set your nearest AAC
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Quick access to your Active Ageing Centre
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActivePanel("aac-search")}
            className="flex-shrink-0 flex items-center gap-1 px-3 py-2 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/15 active:bg-primary/20 rounded-lg transition-colors min-h-[44px]"
          >
            Browse
            <ChevronRight size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }

  const poi = buildPOIFromMyAAC(myAAC);

  return (
    <div className="mx-3 mt-3 rounded-xl border border-border bg-card ring-1 ring-poi-aac/20 p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-poi-aac/15 flex items-center justify-center">
          <Building2 size={20} className="text-poi-aac" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-poi-aac">
            My AAC
          </p>
          <p className="text-sm font-semibold text-foreground mt-0.5 truncate" title={myAAC.name}>
            {myAAC.name}
          </p>
        </div>
        <button
          type="button"
          onClick={clearMyAAC}
          aria-label="Remove saved AAC"
          className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
        >
          <X size={14} className="text-muted-foreground" aria-hidden="true" />
        </button>
      </div>

      <div className="flex items-center gap-2 mt-3">
        {myAAC.phone && (
          <a
            href={`tel:${myAAC.phone}`}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-lg bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/15 active:bg-green-500/20 transition-colors min-h-[44px]"
          >
            <Phone size={15} aria-hidden="true" />
            Call
          </a>
        )}
        <button
          type="button"
          disabled={isWalking}
          onClick={() => walkTo(poi)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/15 active:bg-blue-500/20 transition-colors min-h-[44px] disabled:opacity-50"
        >
          <Footprints size={15} aria-hidden="true" />
          Walk There
        </button>
        <button
          type="button"
          onClick={() => setActivePanel("aac-search")}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-lg bg-purple-500/10 text-purple-700 dark:text-purple-400 hover:bg-purple-500/15 active:bg-purple-500/20 transition-colors min-h-[44px]"
        >
          <Calendar size={15} aria-hidden="true" />
          Activities
        </button>
      </div>
    </div>
  );
}
