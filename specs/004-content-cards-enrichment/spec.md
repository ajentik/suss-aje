# Spec 004: Enrich Content Cards & POI Data

## Problem
Current POI data is minimal — basic name, coordinates, and one-line description. Event cards are plain. No images, no rich metadata, no interactive elements.

## Solution

### US-1: Enriched POI Cards
- Add photos/thumbnail URLs to POIs (Google Places photos or static assets)
- Add tags/chips for features (e.g., "Halal", "WiFi", "Wheelchair Accessible")
- Add distance from campus centre to each POI
- Add contact info (phone, website) where available
- Render POI cards with image, rating stars, distance badge, tag chips

### US-2: Rich Event Cards
- Add event organizer logo/avatar
- Add registration link button ("Register Now")
- Add "Add to Calendar" action (Google Calendar deep link)
- Show event venue on mini-map thumbnail
- Colour-code by category (lecture=blue, career=green, social=orange, etc.)

### US-3: Campus Building Cards
- Interactive building cards with floor-by-floor breakdown
- "What's here" quick summary
- Current status indicator (open/closed based on time)
- Quick action buttons: "Navigate Here", "More Info"

### US-4: Nearby Venues Enhancement
- Add Google Places rating, price level, photos
- "Open Now" / "Closes at X" live status
- Walking time from campus
- Popular times indicator

## Affected Files
- `src/types/index.ts` — extend POI and CampusEvent interfaces
- `src/lib/maps/campus-pois.ts` — enrich POI data
- `src/components/events/EventCard.tsx` — rich event rendering
- `src/components/map/POIPopup.tsx` — enriched popup
- `src/components/ui/POICard.tsx` — NEW: reusable POI card
- `src/components/ui/VenueCard.tsx` — NEW: nearby venue card
- `public/campus-events.json` — add organizer, registration URLs
