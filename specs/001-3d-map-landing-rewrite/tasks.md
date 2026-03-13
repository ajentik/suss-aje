# Tasks: 3D Map & Landing Page Rewrite

**Input**: Design documents from `/specs/001-3d-map-landing-rewrite/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Not requested in specification. Manual QA + `next build` + ESLint only.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Exact file paths included in all descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Foundation changes shared across all user stories

- [ ] T001 Add `selectedPOI` and `setSelectedPOI` state to Zustand store in `src/store/app-store.ts`
- [ ] T002 Wrap map area with `APIProvider` component in `src/components/layout/AppShell.tsx` — props: `apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}`, `version="alpha"`, `libraries={["maps3d", "streetView"]}`

**Checkpoint**: Store updated, APIProvider wrapping map area. All user stories can now proceed.

---

## Phase 2: User Story 1 — Cinematic Landing Page with Aerial Flyover Background (Priority: P1) 🎯 MVP

**Goal**: Replace runtime Aerial View API fetch with static video asset, add progress bar loading, increase video visibility.

**Independent Test**: Load app at `/`. Verify aerial flyover video plays as full background, SUSS branding visible, progress bar during load, "Explore Campus" transitions to main app.

### Implementation for User Story 1

- [ ] T003 [US1] Obtain aerial flyover video and place at `public/suss-aerial.mp4` (pre-download from Aerial View API or use placeholder)
- [ ] T004 [US1] Rewrite `src/components/layout/HeroIntro.tsx`:
  - Remove `lookupAerialVideo` import and API fetch call
  - Change video source to static `/suss-aerial.mp4`
  - Replace pulse-dot loading indicator with a thin horizontal progress bar at bottom of screen on SUSS gradient background (`#003B5C`)
  - Track video loading progress via `video.buffered` / `video.duration` events
  - Set `videoReady` state on `canplaythrough` event, cross-fade from gradient to video
  - Increase video opacity (remove `opacity-90`, use subtle gradient overlay for text readability only)
  - Add `aria-label="Enter campus explorer"` on "Explore Campus" button
  - Retain: autoPlay, loop, muted, playsInline on `<video>` element
  - Retain: fade-out animation on "Explore Campus" click (700ms then `onEnter()`)
- [ ] T005 [US1] Remove unused exports from `src/lib/maps/aerial-view.ts` — delete `renderAerialVideo` and `getAerialVideoUrl` functions. Keep `lookupAerialVideo` (used by `AerialViewButton.tsx`)

**Checkpoint**: Landing page loads static video with progress bar. No API dependency. Build passes.

---

## Phase 3: User Story 2 — Declarative 3D Map Rendering (Priority: P1) 🎯 MVP

**Goal**: Rewrite MapView from imperative DOM manipulation to declarative `@vis.gl/react-google-maps` components.

**Independent Test**: Navigate past landing page. Verify 3D map renders at ~800m altitude with 37+ POI markers. Map is interactive (zoom, rotate, tilt). Click marker → popup with name/category/"Navigate here".

### Implementation for User Story 2

- [ ] T006 [P] [US2] Create `src/components/map/POIPopup.tsx` — floating card component:
  - Props: `poi: POI`, `onNavigate: (poi: POI) => void`, `onClose: () => void`
  - Renders: POI name, category, description (if exists), "Navigate here" button, close (×) button
  - Styling: absolute-positioned card with shadow, positioned in center of map viewport
  - Accessibility: `role="dialog"`, `aria-label`, keyboard-focusable close button
- [ ] T007 [US2] Rewrite `src/components/map/MapView.tsx` — full declarative rewrite:
  - Remove ALL imperative DOM code (`document.createElement`, `setAttribute`, `appendChild`, polling loops)
  - Import `Map3D`, `Marker3D` from `@vis.gl/react-google-maps/alpha`
  - Render `<Map3D>` with `defaultCenter={CAMPUS_CENTER}` (lat: 1.3299, lng: 103.7764, altitude: 0), `defaultRange={800}`, `defaultTilt={55}`, `defaultHeading={0}`, `mode="hybrid"`
  - Use `ref` with type `React.RefObject<Map3DRef>` for camera control
  - Render 37+ `<Marker3D>` children by mapping over `CAMPUS_POIS` — each with `position={{lat, lng}}`, `onClick` handler that calls `setSelectedPOI(poi)`
  - Render `<POIPopup>` when `selectedPOI` is set (read from store)
  - POIPopup `onNavigate` callback: call `flyCameraTo()` via ref, then `setSelectedPOI(null)` and `setFlyToTarget(null)`
  - Handle `onError` callback on `Map3D` to show error fallback UI
  - Keep internal state `inStreetView` and `streetViewLocation` for street view toggling
  - On map double-click (`onClick`): set `inStreetView=true` with clicked coordinates
  - `useEffect` watching `flyToTarget`: when non-null, call `map3dRef.current?.flyCameraTo({center: {lat, lng, altitude: flyToTarget.altitude || 200}, range: 200, tilt: 55, heading: 0, durationMillis: 2000})` then `setFlyToTarget(null)`

**Checkpoint**: 3D map renders declaratively with all POI markers, POI popup works, camera responds to store changes. Build passes.

---

## Phase 4: User Story 3 — Smooth Camera Fly-To Navigation (Priority: P2)

**Goal**: Camera animations via `flyCameraTo()` instead of instant attribute jumps.

**Independent Test**: Use chat to ask "Navigate to SUSS Library." Verify camera smoothly animates to location.

### Implementation for User Story 3

- [ ] T008 [US3] Verify `flyCameraTo()` integration in `src/components/map/MapView.tsx` — the `useEffect` from T007 already implements this. Verify:
  - Animation `durationMillis` is 2000ms for smooth fly-to
  - `flyToTarget` is set to `null` after animation starts (not after completion) to prevent re-triggers
  - Altitude defaults to 200m for close-up POI view when navigating
  - Camera tilt is 55° for 3D perspective during fly-to

**Checkpoint**: Camera animations work smoothly via AI chat navigation and POI popup "Navigate here". No instant jumps.

---

## Phase 5: User Story 4 — Walking Route with Polyline Overlay (Priority: P2)

**Goal**: Blue polyline on 3D map showing walking route when navigation is computed.

**Independent Test**: Ask AI to navigate between two locations. Verify blue polyline appears on map. New route replaces old. Clear route removes polyline.

### Implementation for User Story 4

- [ ] T009 [US4] Create `src/components/map/RoutePolyline.tsx`:
  - Props: `coordinates: google.maps.LatLngLiteral[]`, `color?: string` (default `"#4285F4"`), `width?: number` (default `8`)
  - Returns `null` (renders nothing to React tree)
  - Uses `useMap3D()` hook from `@vis.gl/react-google-maps/alpha` to get map element
  - In `useEffect`: creates `gmp-polyline-3d` via `document.createElement`, sets `altitude-mode="CLAMP_TO_GROUND"`, `stroke-color`, `stroke-width`, formats coordinates as `lat,lng,0` space-separated string, appends to map element
  - Cleanup: removes polyline element on unmount or coordinate change
- [ ] T010 [US4] Integrate `RoutePolyline` in `src/components/map/MapView.tsx`:
  - Import `RoutePolyline`
  - Read `routeInfo` from Zustand store
  - When `routeInfo?.polyline` exists, render `<RoutePolyline coordinates={routeInfo.polyline} />` as child of `<Map3D>`

**Checkpoint**: Route polylines render on map. Old polyline replaced by new. Cleared when route is cleared.

---

## Phase 6: User Story 5 — Street View Integration (Priority: P3)

**Goal**: Extract Street View into separate component. Double-click map → Street View. "Back" button returns to 3D map.

**Independent Test**: Double-click on 3D map. Verify Street View opens. Click "Back to 3D Map" to return.

### Implementation for User Story 5

- [ ] T011 [US5] Create `src/components/map/StreetViewPanel.tsx`:
  - Props: `location: { lat: number; lng: number }`, `onBack: () => void`
  - Renders: full-size container with `google.maps.StreetViewPanorama` initialized at `location`
  - "Back to 3D Map" button: `type="button"`, `aria-label="Return to 3D map view"`, calls `onBack()`
  - Uses `useRef` for Street View container div, initializes panorama in `useEffect`
  - Cleanup: destroys panorama on unmount
- [ ] T012 [US5] Integrate `StreetViewPanel` in `src/components/map/MapView.tsx`:
  - When `inStreetView === true && streetViewLocation !== null`, render `<StreetViewPanel>` instead of `<Map3D>`
  - `onBack` callback: set `inStreetView=false`, `streetViewLocation=null`

**Checkpoint**: Street View opens on double-click, "Back" returns to 3D map. Build passes.

---

## Phase 7: User Story 6 — Dead Code Cleanup (Priority: P3)

**Goal**: Remove all unused components, hooks, and functions.

**Independent Test**: Build passes. No import errors. Grep confirms no references to removed code.

### Implementation for User Story 6

- [ ] T013 [P] [US6] Delete `src/components/map/MapMarker.tsx` — dead code, never imported
- [ ] T014 [P] [US6] Delete `src/hooks/useMapNavigation.ts` — dead code, navigation handled in ChatPanel
- [ ] T015 [US6] Verify no remaining references to deleted files — grep for `MapMarker`, `useMapNavigation`, `renderAerialVideo`, `getAerialVideoUrl` across codebase

**Checkpoint**: All dead code removed. Build passes with zero import errors.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, build, and validation

- [ ] T016 Run `npm run build` — verify zero TypeScript and ESLint errors
- [ ] T017 Run `npm run lint` — verify zero linting errors
- [ ] T018 Run quickstart.md verification checklist:
  1. Landing page shows video with progress bar
  2. "Explore Campus" → smooth transition
  3. 3D map renders at 800m altitude with POI markers
  4. Click marker → popup with name/category/navigate
  5. "Navigate here" → camera flies to location
  6. AI navigation → camera animates smoothly
  7. Double-click map → Street View opens
  8. "Back to 3D Map" → returns to 3D view

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (US1 — Landing Page)**: Depends on T005 removing unused aerial-view exports, but NOT on Phase 1 store changes. Can start in parallel with Phase 1.
- **Phase 3 (US2 — 3D Map)**: Depends on Phase 1 (T001 for `selectedPOI` state, T002 for `APIProvider`)
- **Phase 4 (US3 — Fly-To)**: Depends on Phase 3 (fly-to is implemented as part of MapView rewrite)
- **Phase 5 (US4 — Polyline)**: Depends on Phase 3 (needs Map3D rendered to use `useMap3D()`)
- **Phase 6 (US5 — Street View)**: Depends on Phase 3 (needs MapView structure)
- **Phase 7 (US6 — Dead Code)**: Can run after Phase 3 (MapView rewrite removes MapMarker dependency)
- **Phase 8 (Polish)**: Depends on all previous phases

### User Story Dependencies

- **US1 (Landing Page)**: Independent — no dependency on other stories
- **US2 (3D Map)**: Independent after Phase 1 setup
- **US3 (Fly-To)**: Subset of US2 — verified after US2 implementation
- **US4 (Polyline)**: Depends on US2 (needs Map3D)
- **US5 (Street View)**: Depends on US2 (needs MapView structure)
- **US6 (Dead Code)**: Depends on US2 (MapView rewrite must be complete first)

### Parallel Opportunities

- **T001 + T002**: Can run in parallel (different files)
- **T003 + T005**: Can run in parallel (different files)
- **T006 + T003**: Can run in parallel (new file vs static asset)
- **T013 + T014**: Can run in parallel (different files, both deletions)
- **US1 (Phase 2) + Phase 1**: Can run in parallel

---

## Parallel Example: Phase 1 + US1

```bash
# Launch in parallel (different files):
Task T001: "Add selectedPOI state to src/store/app-store.ts"
Task T002: "Wrap map area with APIProvider in src/components/layout/AppShell.tsx"
Task T003: "Obtain aerial video for public/suss-aerial.mp4"
Task T005: "Remove unused exports from src/lib/maps/aerial-view.ts"
```

## Parallel Example: US2 Components

```bash
# Launch in parallel (new file + existing file):
Task T006: "Create src/components/map/POIPopup.tsx"
# Then sequential:
Task T007: "Rewrite src/components/map/MapView.tsx" (depends on T006)
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Complete Phase 1: Setup (T001, T002)
2. Complete Phase 2: US1 Landing Page (T003, T004, T005)
3. Complete Phase 3: US2 3D Map (T006, T007)
4. **STOP and VALIDATE**: Build passes, landing page + map work independently
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + US1 → Landing page works → can demo
2. Add US2 → 3D map works → core experience complete
3. Add US3 → Camera animations verified → polish
4. Add US4 → Route polylines → navigation complete
5. Add US5 → Street View → exploration complete
6. Add US6 → Dead code removed → clean codebase
7. Polish → Build verified → ship

---

## Notes

- No test infrastructure — verification is manual QA + `next build` + `npm run lint`
- API key is empty locally — map features only testable in Railway production or with local key
- Static video asset (`public/suss-aerial.mp4`) must be obtained/created before T004
- `gmp-polyline-3d` has no React wrapper — imperative DOM is justified per constitution (isolated in RoutePolyline.tsx)
- Commit after each phase or logical group
