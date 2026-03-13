# Data Model: 3D Map & Landing Page Rewrite

**Date**: 2026-03-13  
**Branch**: `001-3d-map-landing-rewrite`

## Entities

### POI (unchanged)
```typescript
interface POI {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
  description: string;
  address?: string;
  hours?: string;
  rating?: number;
  notes?: string;
  cuisine?: string;
}
```
- **Source**: `src/lib/maps/campus-pois.ts` (37+ static entries)
- **Relationships**: Referenced by `AppState.selectedDestination`, `AppState.selectedPOI` (new)
- **No changes** to the entity itself

### RouteInfo (unchanged)
```typescript
interface RouteInfo {
  polyline: google.maps.LatLngLiteral[];
  distanceMeters: number;
  duration: string;
}
```
- **Source**: Computed from Google Routes API via `src/lib/maps/route-utils.ts`
- **Relationships**: Stored in `AppState.routeInfo`, rendered by `RoutePolyline` component (new)
- **No changes** to the entity itself

### FlyToTarget (unchanged)
```typescript
type FlyToTarget = {
  lat: number;
  lng: number;
  altitude?: number;
} | null;
```
- **Source**: Set by AI tool `navigate_to` or POI popup "Navigate here" button
- **Relationships**: Stored in `AppState.flyToTarget`, consumed by `MapView` to trigger `flyCameraTo()`

### AerialVideo (reduced scope)
```typescript
// Landing page: static asset at /public/suss-aerial.mp4
// AerialViewButton: still uses Aerial View API at runtime

interface AerialVideo {
  uris: Record<string, string>;
  state: "ACTIVE" | "PROCESSING" | "NEEDS_PROCESSING";
  metadata?: {
    videoId: string;
    captureDate?: { year: number; month: number; day: number };
    duration?: string;
  };
}
```
- **Change**: Landing page no longer fetches from API. The `AerialVideo` type is retained for the `AerialViewButton` feature only.

## State Changes (Zustand Store)

### New fields
```typescript
// Added to AppState
selectedPOI: POI | null;                    // Currently selected POI for info popup
setSelectedPOI: (poi: POI | null) => void;  // Set/clear selected POI
```

### Unchanged fields
- `selectedDestination`, `routeInfo`, `flyToTarget` — no changes
- `activePanel`, `eventDateFilter`, `eventCategoryFilter` — no changes
- `isSpeaking`, `ttsEnabled` — no changes

## State Transitions

### Landing Page Flow
```
Page Load → [gradient background + progress bar]
         → Video loads → [cross-fade to video]
         → User clicks "Explore Campus" → [fade out, show AppShell]
```

### Map Interaction Flow
```
AppShell loads → [Map3D renders with 800m range]
             → All 37+ Marker3DInteractive rendered
             → User clicks marker → [selectedPOI set, popup shown]
             → User clicks "Navigate here" → [flyCameraTo(), selectedPOI cleared]
             → AI triggers navigate_to → [flyToTarget set, flyCameraTo()]
             → Route computed → [routeInfo set, polyline rendered]
```

### Street View Flow
```
3D Map active → User double-clicks → [Street View opens]
             → User clicks "Back to 3D Map" → [3D Map restored]
```
