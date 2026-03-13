# Component Contracts: Landing Page

**Date**: 2026-03-13  
**Branch**: `001-3d-map-landing-rewrite`

## HeroIntro (modify)

**File**: `src/components/layout/HeroIntro.tsx`  
**Responsibility**: Full-screen landing page with cinematic aerial flyover video background.

```typescript
interface HeroIntroProps {
  onEnter: () => void;
}
export default function HeroIntro({ onEnter }: HeroIntroProps): JSX.Element;
```

**Changes from current**:
1. **Video source**: Static asset `/suss-aerial.mp4` instead of Aerial View API fetch
2. **Loading state**: Progress bar on gradient background (replaces pulse dots)
3. **Video opacity**: Increase from `opacity-90` to full (remove opacity constraint, use subtle gradient overlays only for text readability)
4. **Remove**: `lookupAerialVideo` import and API call
5. **Add**: `aria-label` on "Explore Campus" button

**Internal state**:
- `videoProgress: number` — 0-100% loading progress from `<video>` buffered events
- `videoReady: boolean` — video canplaythrough fired
- `fadeOut: boolean` — exit transition active

**Renders**:
- Gradient background (`#003B5C`) — always visible as base layer
- Progress bar — thin horizontal bar at bottom, visible while `!videoReady`
- `<video>` element — static src `/suss-aerial.mp4`, autoPlay, loop, muted, playsInline
- SUSS logo, title, subtitle, "Explore Campus" button — overlaid with animations
- Attribution text

**Key behaviors**:
- On mount: video starts loading from static asset
- Progress bar tracks `video.buffered` / `video.duration`
- When `canplaythrough` fires: cross-fade from gradient to video
- "Explore Campus" click: `setFadeOut(true)`, after 700ms call `onEnter()`

---

## AppShell (modify)

**File**: `src/components/layout/AppShell.tsx`  
**Responsibility**: Main application layout with sidebar and map.

```typescript
export default function AppShell(): JSX.Element;
```

**Changes from current**:
1. **Add**: `<APIProvider>` wrapper around the map area
2. **APIProvider props**: `apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}`, `version="alpha"`, `libraries={["maps3d", "streetView"]}`

**Structure**:
```tsx
<div className="h-dvh w-full flex flex-col md:flex-row overflow-hidden">
  {/* Left sidebar — unchanged */}
  <div className="md:w-[400px] ...">
    {/* Header, Tabs, ChatPanel, EventsPanel — unchanged */}
  </div>
  
  {/* Right panel — wrapped with APIProvider */}
  <APIProvider apiKey={...} version="alpha" libraries={["maps3d", "streetView"]}>
    <div className="flex-1 h-full relative">
      <MapView />
      <RouteOverlay />
      <AerialViewButton />
    </div>
  </APIProvider>
</div>
```
