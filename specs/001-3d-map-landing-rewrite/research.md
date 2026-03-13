# Research: 3D Map & Landing Page Rewrite

**Date**: 2026-03-13  
**Branch**: `001-3d-map-landing-rewrite`

## R1: @vis.gl/react-google-maps 3D Components API

**Decision**: Use `@vis.gl/react-google-maps` v1.7.x declarative React components for all map rendering.

**Rationale**: The library provides `Map3D`, `Marker3D`, and `Marker3DInteractive` components that wrap Google Maps 3D web components (`gmp-map-3d`, `gmp-marker-3d`) with a clean React API. This replaces all imperative DOM manipulation (createElement, setAttribute, appendChild) in the current MapView.tsx.

**Alternatives considered**:
- Raw `gmp-map-3d` web components with React refs — rejected because `@vis.gl/react-google-maps` already handles the complexity of prop-to-attribute mapping, script loading, and lifecycle.
- `@googlemaps/js-api-loader` — only handles script loading, doesn't provide React components.

**Key findings**:

### Map3D Component
- Props: `center` (`{lat, lng, altitude}`), `range` (camera distance in meters), `tilt` (0-90°), `heading` (0-360°), `mode` (`"hybrid" | "satellite"`), `defaultCenter`, `defaultRange`, `defaultTilt`, `defaultHeading`
- Ref type: `Map3DElement` (extends HTMLElement, provides `flyCameraTo()` and `flyCameraAround()`)
- Children: Rendered as children of the `<gmp-map-3d>` element — `Marker3D`, `Marker3DInteractive`, and raw web components like `<gmp-polyline-3d>` can be direct children

### Marker3D Component
- Props: `position` (`{lat, lng, altitude?}`), `altitudeMode` (`"ABSOLUTE" | "CLAMP_TO_GROUND" | "RELATIVE_TO_GROUND" | "RELATIVE_TO_MESH"`), `collisionBehavior`, `label`, `title`, `drawsWhenOccluded`, `extruded`, `zIndex`
- **Automatically switches** to `Marker3DInteractiveElement` when `onClick` prop is present — no separate import needed
- `onClick`: `(e: Event) => void` — triggers interactive mode
- `title`: `string` — tooltip, only available when `onClick` is present
- Children: `img` and `svg` children are auto-wrapped in `<template>` for custom marker content

### Map3D Ref Type
```typescript
interface Map3DRef {
  map3d: google.maps.maps3d.Map3DElement | null;
  flyCameraTo: (options: google.maps.maps3d.FlyToAnimationOptions) => void;
  flyCameraAround: (options: google.maps.maps3d.FlyAroundAnimationOptions) => void;
  stopCameraAnimation: () => void;
}
```

### flyCameraTo()
- Called via `map3dRef.current?.flyCameraTo({ center: {lat, lng, altitude}, range, tilt, heading, durationMillis })`
- `durationMillis`: animation duration in milliseconds
- Called directly on the ref (the ref wraps the underlying method)

### flyCameraAround()
- `map3dRef.current?.flyCameraAround({ center, range, tilt, heading, durationMillis, rounds })`
- Orbits the camera around a point — useful for cinematic effects but not needed for POI navigation

### Map3D Events
- `onCameraChanged`, `onCenterChanged`, `onHeadingChanged`, `onTiltChanged`, `onRangeChanged`, `onRollChanged`
- `onClick`, `onSteadyChange`, `onAnimationEnd`, `onError`

### APIProvider
- Props: `apiKey` (string), `version` (string, e.g., "alpha"), `libraries` (string[]), `region`, `language`
- `onLoad`: `() => void` — fires when API is ready
- `onError`: `(error: unknown) => void` — fires when API loading fails
- Handles all script loading — replaces the manual script injection and polling in current MapView.tsx
- Must wrap the entire map component tree

### gmp-polyline-3d (Web Component)
- No React wrapper in the library — must use raw web component
- **CRITICAL**: Map3D renders children as siblings to the `<gmp-map-3d>` element, NOT as children of it. Therefore `gmp-polyline-3d` must be manually appended to the map instance via `useMap3D()` hook + ref.
- Attributes: `coordinates` (Iterable of LatLngAltitudeLiteral), `strokeColor` (string), `strokeWidth` (number), `altitudeMode` (AltitudeMode), `drawsOccludedSegments` (boolean)

### Pattern for Polyline Rendering
```tsx
import { useMap3D } from '@vis.gl/react-google-maps';

function RoutePolyline({ coordinates }: { coordinates: google.maps.LatLngAltitudeLiteral[] }) {
  const map3d = useMap3D();
  
  useEffect(() => {
    if (!map3d || coordinates.length === 0) return;
    
    const polyline = document.createElement('gmp-polyline-3d');
    polyline.setAttribute('altitude-mode', 'CLAMP_TO_GROUND');
    polyline.setAttribute('stroke-color', '#4285F4');
    polyline.setAttribute('stroke-width', '8');
    
    const coordStr = coordinates.map(c => `${c.lat},${c.lng},0`).join(' ');
    polyline.setAttribute('coordinates', coordStr);
    
    map3d.appendChild(polyline);
    return () => { polyline.remove(); };
  }, [map3d, coordinates]);
  
  return null;
}
```

## R2: Static Aerial Video Asset

**Decision**: Pre-download the SUSS aerial flyover video and serve from `/public/suss-aerial.mp4`.

**Rationale**: User explicitly chose static asset over runtime API fetch. Benefits:
- Eliminates Aerial View API dependency for landing page
- Deterministic load time (file size known, progress bar can be determinate)
- Works even without API key
- Faster cold starts

**Alternatives considered**:
- Runtime Aerial View API fetch — rejected by user; adds latency and API dependency for the first impression
- Embedding video in CSS background — rejected; `<video>` element offers better control (loop, muted, playsinline, progress events)

**Action required**: Download the aerial video from Aerial View API once and place in `/public/suss-aerial.mp4`. This needs the API key during development.

## R3: POI Info Popup Architecture

**Decision**: Use `Marker3DInteractive` with click handler that opens a custom popup component.

**Rationale**: `Marker3DInteractive` provides onClick events. When clicked, show a floating popup positioned near the marker with POI name, category, and "Navigate here" button.

**Alternatives considered**:
- Google Maps InfoWindow — not available in 3D maps (gmp-map-3d doesn't support InfoWindow)
- Tooltip on hover — rejected; need "Navigate here" button which requires click interaction

**Implementation approach**: Store `selectedPOI` in Zustand. When a `Marker3DInteractive` is clicked, set `selectedPOI`. A `POIPopup` component reads from the store and renders an absolutely-positioned card near the marker. "Navigate here" calls `flyCameraTo()` via the Map3D ref.

## R4: Progress Bar for Video Loading

**Decision**: Show a thin progress bar on the SUSS gradient background while the video loads.

**Rationale**: User chose progress bar over shimmer/spinner. Since the video is a static asset with a known file size, the progress bar can show determinate progress using the `<video>` element's `progress` and `canplaythrough` events.

**Implementation approach**: Use `video.buffered` in combination with `video.duration` to calculate loading progress. Show a thin horizontal bar at the bottom of the landing page with SUSS brand accent color.

## R5: Map Camera Default Altitude

**Decision**: Default camera altitude/range of ~800m for wide campus overview.

**Rationale**: User chose 800m to show the full campus and surrounding area in one view. Markers will be visible but small, giving users the spatial context of the campus within the neighborhood.

**Implementation**: Set `defaultRange={800}` on the `Map3D` component with `defaultTilt={55}` and `defaultCenter` at CAMPUS_CENTER with altitude 0.
