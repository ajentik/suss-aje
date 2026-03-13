# Component Contracts: Map Components

**Date**: 2026-03-13  
**Branch**: `001-3d-map-landing-rewrite`

## MapView (rewrite)

**File**: `src/components/map/MapView.tsx`  
**Responsibility**: Renders the 3D map with all POI markers, handles camera navigation and street view toggling.

```typescript
// No external props — reads from Zustand store
export default function MapView(): JSX.Element;
```

**Internal state**:
- `inStreetView: boolean` — whether street view is active
- `streetViewLocation: {lat, lng} | null` — street view target

**Store dependencies**:
- Reads: `flyToTarget`, `routeInfo`, `selectedPOI`
- Writes: `setFlyToTarget(null)` (after fly-to completes), `setSelectedPOI`

**Renders**:
- `<Map3D>` with `defaultCenter`, `defaultRange={800}`, `defaultTilt={55}`, `defaultHeading={0}`
  - 37+ `<Marker3D>` children with `onClick` handlers
  - `<RoutePolyline>` when `routeInfo` is present
- `<POIPopup>` when `selectedPOI` is set
- `<StreetViewPanel>` when `inStreetView` is true

**Key behaviors**:
- Uses `Map3D` ref to call `flyCameraTo()` when `flyToTarget` changes
- `Marker3D` onClick sets `selectedPOI` in store
- Double-click on map triggers street view
- `onError` callback shows error message fallback

---

## POIPopup (new)

**File**: `src/components/map/POIPopup.tsx`

```typescript
interface POIPopupProps {
  poi: POI;
  onNavigate: (poi: POI) => void;
  onClose: () => void;
}
export default function POIPopup({ poi, onNavigate, onClose }: POIPopupProps): JSX.Element;
```

**Renders**: Floating card with POI name, category, description, and "Navigate here" button.  
**Accessibility**: `role="dialog"`, `aria-label`, keyboard-focusable close button, focus trap.

---

## RoutePolyline (new)

**File**: `src/components/map/RoutePolyline.tsx`

```typescript
interface RoutePolylineProps {
  coordinates: google.maps.LatLngLiteral[];
  color?: string;      // default: "#4285F4"
  width?: number;      // default: 8
}
export default function RoutePolyline({ coordinates, color, width }: RoutePolylineProps): null;
```

**Implementation**: Uses `useMap3D()` hook to get the underlying map element, creates `gmp-polyline-3d` via DOM API, appends it to map element, cleans up on unmount/coordinate change.

---

## StreetViewPanel (extracted)

**File**: `src/components/map/StreetViewPanel.tsx`

```typescript
interface StreetViewPanelProps {
  location: { lat: number; lng: number };
  onBack: () => void;
}
export default function StreetViewPanel({ location, onBack }: StreetViewPanelProps): JSX.Element;
```

**Renders**: Full-viewport Google Street View panorama with "Back to 3D Map" button.  
**Accessibility**: Button has `type="button"`, `aria-label="Return to 3D map view"`.
