# Feature Specification: 3D Map & Landing Page Rewrite

**Feature Branch**: `001-3d-map-landing-rewrite`
**Created**: 2026-03-13
**Status**: Draft
**Input**: User description: "Rewrite 3D map module with @vis.gl/react-google-maps, improve landing page with SUSS aerial flyover as dynamic background"

## Clarifications

### Session 2026-03-13

- Q: How should the landing page handle the loading state while the aerial flyover video is being fetched from the Aerial View API? → A: Show a progress bar overlaid on the SUSS gradient background (#003B5C) while the video loads, then transition to the video when ready.
- Q: What should happen when a user clicks a POI Marker3D on the 3D map? → A: Show an info popup/tooltip with POI name and category, plus a "Navigate here" button to trigger fly-to.
- Q: What default camera altitude for the 3D map on initial load? → A: ~800m wide overview showing the full campus and surrounding area.
- Q: Should the aerial flyover video be fetched from Google Aerial View API at runtime, or pre-downloaded as a static asset? → A: Pre-download and serve as a static asset from /public. Faster load, no API dependency at runtime.
- Q: What level of accessibility should this rewrite target? → A: Basic a11y — semantic HTML, keyboard-focusable buttons, aria-labels on interactive elements. No screen reader optimization for the 3D map canvas.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cinematic Landing Page with Aerial Flyover Background (Priority: P1)

A prospective student or campus visitor opens the SUSS AJE web app for the first time. The landing page immediately greets them with a full-screen cinematic aerial flyover video of the SUSS campus playing as the dynamic background (served as a static asset from /public for fast, reliable loading). The SUSS branding (logo, tagline) is overlaid on the video with tasteful transparency. The video loops seamlessly. The user clicks "Explore Campus" to enter the main application with a smooth fade transition.

**Why this priority**: The landing page is the first impression. A cinematic flyover background creates immediate visual impact and communicates the app's 3D spatial capabilities before the user even interacts.

**Independent Test**: Load the application at `/`. Verify the aerial flyover video plays as the full background, SUSS branding is clearly visible on top, and clicking "Explore Campus" transitions smoothly to the main app.

**Acceptance Scenarios**:

1. **Given** the user opens the app for the first time, **When** the page loads, **Then** the SUSS aerial flyover video plays as a full-screen dynamic background with the SUSS logo and "Campus Intelligent Assistant" title overlaid.
2. **Given** the landing page is visible and the video is playing, **When** the user clicks "Explore Campus", **Then** the landing page fades out smoothly (within 600ms) and the main application (AppShell) becomes visible.
3. **Given** the static aerial video asset fails to load (network error, corrupted file), **When** the page loads, **Then** a static SUSS-branded background (gradient with #003B5C) is displayed as fallback, with all other UI elements functioning normally.
4. **Given** the video has loaded, **When** it reaches the end, **Then** it loops seamlessly without a visible restart artifact.
5. **Given** the page is loading and the aerial video is being fetched, **When** the user sees the landing page, **Then** a progress bar is visible on the SUSS gradient background (#003B5C) indicating video load progress.

---

### User Story 2 - Declarative 3D Map Rendering (Priority: P1)

A user enters the main application and sees a 3D interactive map of the SUSS campus rendered using Google Maps 3D. The map is centered on the SUSS campus with all 37+ POI markers visible. The map loads via the `@vis.gl/react-google-maps` library using declarative React components (`APIProvider`, `Map3D`, `Marker3D`) instead of imperative DOM manipulation. The user can rotate, zoom, and tilt the 3D map.

**Why this priority**: The 3D map is the core feature of the application. Without a working, cleanly-rendered map, none of the navigation, POI, or routing features function.

**Independent Test**: Navigate past the landing page. Verify the 3D map renders showing the SUSS campus with POI markers. Verify the map is interactive (zoom, rotate, tilt).

**Acceptance Scenarios**:

1. **Given** the user clicks "Explore Campus" on the landing page, **When** the AppShell loads, **Then** a 3D interactive map of the SUSS campus is rendered centered at the campus coordinates (altitude ~800m) with all POI markers visible.
2. **Given** the map is rendered, **When** the user interacts with mouse/touch (drag, scroll, pinch), **Then** the map responds with smooth rotation, zoom, and tilt.
3. **Given** the API key is missing or invalid, **When** the map attempts to load, **Then** an informative error message is displayed instead of a blank screen.
4. **Given** the map is rendered with POI markers, **When** the user clicks a POI marker, **Then** an info popup appears showing the POI name and category with a "Navigate here" button.
5. **Given** a POI info popup is open, **When** the user clicks "Navigate here", **Then** the camera flies to that POI location using `flyCameraTo()`.

---

### User Story 3 - Smooth Camera Fly-To Navigation (Priority: P2)

A user asks the AI assistant to navigate to a specific campus location (e.g., "Take me to the Library"). The AI triggers a navigate_to tool call, and the 3D map camera smoothly animates (flies) to the target location using the `flyCameraTo()` API — not an instant jump via attribute setting.

**Why this priority**: Smooth camera animations are a significant UX improvement over instant jumps, making the spatial navigation feel natural and giving users spatial context as the camera moves between locations.

**Independent Test**: Use the chat to ask "Navigate to the SUSS Library." Verify the camera smoothly animates to the library location rather than teleporting.

**Acceptance Scenarios**:

1. **Given** the user requests navigation to a POI via chat, **When** the AI triggers `navigate_to`, **Then** the map camera smoothly flies to the target location with visible animation.
2. **Given** the user clicks a POI in the events panel that has a map location, **When** the "Fly to" action is triggered, **Then** the camera animates smoothly to that location.

---

### User Story 4 - Walking Route with Polyline Overlay (Priority: P2)

When a walking route is computed (via AI navigate_to tool), a blue polyline is drawn on the 3D map showing the walking path from the user's starting point to the destination. The route polyline is rendered using the `gmp-polyline-3d` web component inside the Map3D component tree.

**Why this priority**: Route visualization completes the navigation experience. Without visible routes, users only see the destination but not how to get there.

**Independent Test**: Ask the AI to navigate between two locations. Verify a blue polyline appears on the map showing the walking route.

**Acceptance Scenarios**:

1. **Given** a walking route has been computed, **When** the route info is set in the store, **Then** a blue polyline (#4285F4) appears on the 3D map tracing the walking path.
2. **Given** a route polyline is displayed, **When** a new route is computed, **Then** the old polyline is removed and replaced with the new one.
3. **Given** a route polyline is displayed, **When** the route is cleared, **Then** the polyline is removed from the map.

---

### User Story 5 - Street View Integration (Priority: P3)

A user double-clicks on the 3D map to enter Street View at that location. Street View opens in the same viewport, replacing the 3D map. A "Back to 3D Map" button allows returning to the 3D map view. Street View is a separate component from the main map component.

**Why this priority**: Street View is a nice-to-have feature that enhances exploration but is not core to navigation or the landing page experience.

**Independent Test**: Double-click on the 3D map. Verify Street View opens at that location. Click "Back to 3D Map" to return.

**Acceptance Scenarios**:

1. **Given** the 3D map is displayed, **When** the user double-clicks a location, **Then** a Street View panorama opens at or near that location.
2. **Given** Street View is open, **When** the user clicks "Back to 3D Map", **Then** the 3D map is restored to its previous view state.

---

### User Story 6 - Dead Code Cleanup (Priority: P3)

All unused components, hooks, and utility functions are removed from the codebase. Specifically: `MapMarker.tsx` (dead component, never imported), `useMapNavigation.ts` (orphaned hook, navigation duplicated in ChatPanel), `renderAerialVideo` and `getAerialVideoUrl` (unused functions in aerial-view.ts), and `findPOIs` (unused plural variant).

**Why this priority**: Dead code creates confusion and maintenance burden. Removing it is low-risk and improves code clarity.

**Independent Test**: After removal, verify the build passes with no import errors. Grep the codebase for any references to removed code.

**Acceptance Scenarios**:

1. **Given** the rewrite is complete, **When** a build is run, **Then** no import errors or missing module errors occur.
2. **Given** the dead code is removed, **When** searching the codebase, **Then** no references to `MapMarker.tsx`, `useMapNavigation.ts`, or unused aerial-view functions exist.

---

### Edge Cases

- What happens when the Google Maps API key is empty or invalid? → Informative fallback UI with error message.
- What happens when the Aerial View API returns no video for the SUSS address? → Landing page uses the pre-downloaded static video asset; Aerial View API is only used for the AerialViewButton feature, not the landing page.
- What happens when the map loads but POI data is empty? → Map renders without markers (no crash).
- What happens on slow connections? → A progress bar is shown on the landing page gradient background while the aerial video loads; the 3D map shows its own loading state.
- What happens when the user resizes the browser window while the map is displayed? → The map resizes responsively.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The landing page MUST display the SUSS aerial flyover video as a full-screen dynamic background, served as a pre-downloaded static asset from `/public`.
- **FR-002**: The landing page MUST show the SUSS logo, "Campus Intelligent Assistant" title, and "Explore Campus" button overlaid on the video background.
- **FR-003**: The landing page video background MUST be prominently visible (higher opacity than the current 40%, with a more subtle overlay gradient).
- **FR-003a**: All interactive UI elements (buttons, links, popups) MUST have semantic HTML, keyboard focus support, and appropriate aria-labels.
- **FR-004**: The landing page MUST transition smoothly to the AppShell when the user clicks "Explore Campus".
- **FR-005**: The 3D map MUST be rendered using `@vis.gl/react-google-maps` library components (`APIProvider`, `Map3D`, `Marker3D`) instead of imperative DOM manipulation.
- **FR-006**: The `APIProvider` MUST handle Google Maps script loading — no manual script injection or polling.
- **FR-007**: All 37+ campus POIs MUST be rendered as `Marker3D` components on the 3D map.
- **FR-007a**: Clicking a `Marker3D` MUST display an info popup showing the POI name, category, and a "Navigate here" button.
- **FR-007b**: The default map camera altitude MUST be ~800m, providing a wide overview of the full campus and surrounding area.
- **FR-008**: Camera navigation MUST use the `flyCameraTo()` API via ref for smooth animated transitions.
- **FR-009**: Walking route polylines MUST be rendered using `gmp-polyline-3d` web component inside the Map3D component tree.
- **FR-010**: Street View MUST be a separate component from the main 3D map component.
- **FR-011**: The map MUST display an informative error message when the API key is missing or invalid.
- **FR-012**: All dead code (unused components, hooks, functions) MUST be removed.
- **FR-013**: The application MUST build successfully with zero errors after all changes.

### Key Entities

- **POI (Point of Interest)**: Campus location with name, coordinates (lat/lng), category, and optional description. 37+ predefined locations across 10 categories.
- **RouteInfo**: Walking route data containing polyline coordinates, distance, duration, and solar exposure data.
- **AerialVideo**: Aerial flyover video. Landing page uses a pre-downloaded static asset from `/public`; the Aerial View API is retained only for the AerialViewButton on-demand feature.
- **FlyToTarget**: Camera animation target with lat, lng, and optional altitude.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The landing page loads and displays the aerial flyover video within 3 seconds on standard broadband connections.
- **SC-002**: The 3D map renders with all POI markers visible within 5 seconds of entering the main application.
- **SC-003**: Camera fly-to animations complete smoothly without visual jank or instant jumps.
- **SC-004**: The application builds successfully (`next build`) with zero TypeScript or ESLint errors.
- **SC-005**: No dead code remains — all components, hooks, and utility functions are either imported and used, or removed.
- **SC-006**: The flyover video background is clearly visible on the landing page (not obscured by heavy overlays).
