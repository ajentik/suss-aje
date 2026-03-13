# Quickstart: 3D Map & Landing Page Rewrite

**Branch**: `001-3d-map-landing-rewrite`

## Prerequisites

1. Node.js 18+ and npm
2. Git checkout on branch `001-3d-map-landing-rewrite`
3. `.env.local` with `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (empty is OK for landing page, needed for map)
4. `GOOGLE_GENERATIVE_AI_API_KEY` for chat features

## Setup

```bash
npm install
npm run dev
```

## Key Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/map/MapView.tsx` | **REWRITE** | Replace imperative DOM with `Map3D`, `Marker3D` from `@vis.gl/react-google-maps` |
| `src/components/layout/HeroIntro.tsx` | **MODIFY** | Use static video asset, add progress bar, remove Aerial View API fetch |
| `src/components/layout/AppShell.tsx` | **MODIFY** | Wrap map area with `APIProvider` |
| `src/store/app-store.ts` | **MODIFY** | Add `selectedPOI` state for POI popup |
| `src/lib/maps/aerial-view.ts` | **MODIFY** | Remove `renderAerialVideo` and `getAerialVideoUrl` (unused) |
| `src/components/map/MapMarker.tsx` | **DELETE** | Dead code |
| `src/hooks/useMapNavigation.ts` | **DELETE** | Dead code |

## New Files

| File | Description |
|------|-------------|
| `src/components/map/POIPopup.tsx` | Info popup for clicked POI markers |
| `src/components/map/RoutePolyline.tsx` | Polyline overlay using `gmp-polyline-3d` via `useMap3D()` |
| `src/components/map/StreetViewPanel.tsx` | Extracted Street View into separate component |
| `public/suss-aerial.mp4` | Pre-downloaded aerial flyover video (static asset) |

## Verification

```bash
# Build check
npm run build

# Lint check
npm run lint

# Manual QA
npm run dev
# 1. Verify landing page shows video with progress bar
# 2. Click "Explore Campus" — smooth transition
# 3. 3D map renders at 800m altitude with POI markers
# 4. Click a marker — popup appears with name/category/navigate
# 5. Click "Navigate here" — camera flies to location
# 6. Ask AI to navigate — camera animates smoothly
# 7. Double-click map — Street View opens
# 8. Click "Back to 3D Map" — returns to 3D view
```
