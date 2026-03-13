# Implementation Plan: 3D Map & Landing Page Rewrite

**Branch**: `001-3d-map-landing-rewrite` | **Date**: 2026-03-13 | **Spec**: `specs/001-3d-map-landing-rewrite/spec.md`
**Input**: Feature specification from `/specs/001-3d-map-landing-rewrite/spec.md`

## Summary

Rewrite the 3D map module from imperative DOM manipulation to `@vis.gl/react-google-maps` declarative React components (`Map3D`, `Marker3D`), and improve the landing page by replacing the runtime Aerial View API fetch with a pre-downloaded static video asset, adding a progress bar loading state. Extract Street View into a separate component, add POI info popups with "Navigate here" action, implement smooth camera animations via `flyCameraTo()`, and remove all dead code.

## Technical Context

**Language/Version**: TypeScript 5 / React 19 / Next.js 16 (App Router)  
**Primary Dependencies**: `@vis.gl/react-google-maps` ^1.7.1 (already installed, unused), Zustand 5, Tailwind CSS 4  
**Storage**: N/A (client-side only, static POI data)  
**Testing**: No test infrastructure (manual QA + `next build` + ESLint)  
**Target Platform**: Modern browsers (Chrome, Safari, Firefox, Edge), desktop + mobile  
**Project Type**: Web application (Next.js)  
**Performance Goals**: Landing page video visible within 3s, 3D map renders within 5s, smooth 60fps camera animations  
**Constraints**: API key is empty locally, only available in Railway production builds. Static video asset must be committed to `/public/`.  
**Scale/Scope**: 37+ POI markers, single-user client-side app, ~15 source files modified

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Declarative React Patterns | ✅ PASS | Entire goal is to move from imperative to declarative. `Map3D`, `Marker3D` replace `document.createElement`. Only exception: `gmp-polyline-3d` requires imperative DOM via `useMap3D()` hook — isolated in `RoutePolyline.tsx` wrapper. |
| II. Type Safety | ✅ PASS | All new components will have typed props. `Map3DRef` type from library. Store additions typed. No `as any` needed. |
| III. Component Isolation | ✅ PASS | Extracting Street View into `StreetViewPanel.tsx`, route polyline into `RoutePolyline.tsx`, POI popup into `POIPopup.tsx`. Dead code removed. |
| IV. API Key Security | ✅ PASS | API key via `process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`. `APIProvider` handles this. Graceful fallback via `onError` callback. |
| V. User Experience First | ✅ PASS | Progress bar during video load, smooth `flyCameraTo()` animations, 800m default altitude for campus overview. |

**Post-Phase 1 Re-check**: Constitution Principle I violation for `RoutePolyline.tsx` is justified — `gmp-polyline-3d` has no React wrapper in the library. Imperative code is isolated inside a single component with a clean React props interface, which is the explicit exception granted by the constitution.

## Project Structure

### Documentation (this feature)

```text
specs/001-3d-map-landing-rewrite/
├── plan.md              # This file
├── research.md          # Phase 0 output — API research, decisions
├── data-model.md        # Phase 1 output — entities, state changes
├── quickstart.md        # Phase 1 output — setup & verification guide
├── contracts/           # Phase 1 output — component contracts
│   ├── map-components.md
│   └── landing-page.md
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── app/
│   └── page.tsx                           # Entry point (unchanged)
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx                   # MODIFY: wrap map area with APIProvider
│   │   └── HeroIntro.tsx                  # MODIFY: static video, progress bar, remove API fetch
│   ├── map/
│   │   ├── MapView.tsx                    # REWRITE: Map3D + Marker3D declarative
│   │   ├── POIPopup.tsx                   # NEW: info popup for clicked markers
│   │   ├── RoutePolyline.tsx              # NEW: gmp-polyline-3d wrapper via useMap3D()
│   │   ├── StreetViewPanel.tsx            # NEW: extracted from MapView
│   │   ├── RouteOverlay.tsx               # KEEP: route info card (unchanged)
│   │   ├── AerialViewButton.tsx           # KEEP: aerial flyover toggle (unchanged)
│   │   └── MapMarker.tsx                  # DELETE: dead code
│   └── ...
├── hooks/
│   └── useMapNavigation.ts                # DELETE: dead code
├── lib/
│   └── maps/
│       ├── aerial-view.ts                 # MODIFY: remove unused functions
│       ├── campus-pois.ts                 # KEEP (unchanged)
│       ├── route-utils.ts                 # KEEP (unchanged)
│       └── solar-utils.ts                 # KEEP (unchanged)
├── store/
│   └── app-store.ts                       # MODIFY: add selectedPOI state
└── types/
    └── index.ts                           # KEEP (unchanged)

public/
└── suss-aerial.mp4                        # NEW: static aerial flyover video
```

**Structure Decision**: Existing Next.js App Router structure is retained. No new directories needed. Three new component files added under `src/components/map/`. One static asset added to `public/`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Imperative DOM in `RoutePolyline.tsx` | `gmp-polyline-3d` has no React wrapper in `@vis.gl/react-google-maps` v1.7.x | Direct children of `Map3D` are rendered as siblings to `<gmp-map-3d>`, so the polyline must be manually appended via `useMap3D()` |
