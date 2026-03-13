# AskSUSSi — Campus Intelligent Assistant

AI-powered campus assistant for Singapore University of Social Sciences. Chat with AskSUSSi to navigate the 3D campus map, discover events, find nearby food and amenities, and get voice-guided directions.

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **UI** | React 19, Tailwind CSS 4, shadcn/ui (Base-UI primitives) |
| **AI** | Vercel AI SDK + Google Gemini (`gemini-3.1-flash-lite-preview`) |
| **Maps** | Google Maps 3D API (`maps3d` web components) |
| **State** | Zustand 5 |
| **Voice** | Web Speech API (recognition + synthesis, `en-SG`) |
| **Fonts** | Nunito Sans (primary), Source Code Pro (mono) |
| **CI** | GitHub Actions (lint + build on PRs & main) |
| **Deploy** | Railway (auto-deploy on push to main) |

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts             # AI chat streaming endpoint (Gemini)
│   │   └── events/route.ts           # Campus events API
│   ├── globals.css                    # SUSS-branded design tokens (OKLCH)
│   ├── layout.tsx                     # Root layout + fonts
│   └── page.tsx                       # Entry point → HeroIntro → AppShell
│
├── components/
│   ├── chat/
│   │   ├── ChatPanel.tsx              # Main chat interface with tool call handling
│   │   ├── ChatMessage.tsx            # User/assistant message bubbles
│   │   ├── ChatInput.tsx              # Text input + send button
│   │   └── VoiceButton.tsx            # Mic toggle (Web Speech API)
│   ├── events/
│   │   ├── EventsPanel.tsx            # Filterable events list
│   │   ├── EventCard.tsx              # Event card with map fly-to
│   │   └── EventFilter.tsx            # Date / category / school filters
│   ├── layout/
│   │   ├── AppShell.tsx               # Split-pane layout (sidebar + map)
│   │   └── HeroIntro.tsx              # Landing page with aerial video
│   ├── map/
│   │   ├── MapView.tsx                # Google Maps 3D initialisation + markers
│   │   ├── RouteOverlay.tsx           # Walking route info card + solar exposure
│   │   └── AerialViewButton.tsx       # Aerial flyover toggle
│   └── ui/                            # shadcn/ui components (button, card, tabs, etc.)
│
├── hooks/
│   ├── useCampusEvents.ts             # Event fetching & filtering
│   └── useMapNavigation.ts            # Route computation via Google Routes API
│
├── lib/
│   ├── ai/
│   │   ├── provider.ts                # Google Generative AI setup
│   │   ├── system-prompt.ts           # AJE personality + campus context
│   │   └── tools.ts                   # AI tools: navigate_to, show_events, campus_info
│   ├── maps/
│   │   ├── campus-pois.ts             # 37 POIs (campus + nearby venues)
│   │   ├── route-utils.ts             # Google Routes API + polyline decoder
│   │   ├── aerial-view.ts             # Aerial View API integration
│   │   └── solar-utils.ts             # Solar API for sun exposure data
│   └── voice/
│       ├── speech-recognition.ts      # STT wrapper
│       └── speech-synthesis.ts        # TTS wrapper
│
├── store/
│   └── app-store.ts                   # Zustand global state
│
└── types/
    └── index.ts                       # POI, CampusEvent, RouteInfo, ChatMessage
```

## Data Flow

```
User message
  → ChatPanel (useChat hook)
    → POST /api/chat (streaming)
      → Gemini + AI tools
        ├── navigate_to  → Zustand store → MapView flies to POI + RouteOverlay
        ├── show_events  → Zustand store → EventsPanel filters & displays
        └── campus_info  → returns venue/facility info
    → ChatMessage rendered
    → TTS speaks response (if enabled)
```

## POIs & Venues

37 locations across 10 categories:

| Category | Count | Examples |
|---|---|---|
| On-campus | 10 | Library, Lecture Halls, Admin, Sports Complex |
| Supermarket | 5 | FairPrice Finest, FairPrice 24hr, U Stars |
| Restaurant | 4 | Foodclique (campus), HoHo Korean, Sukiya |
| Mall | 5 | Clementi Arcade, Clementi Mall, West Coast Plaza |
| Bar | 4 | Get Some, Berlin Bar, Le White Bar |
| Hawker | 7 | Hawkers' Street (Bib Gourmand), 448 Market, Ayer Rajah |

## Getting Started

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local
# Add: GOOGLE_GENERATIVE_AI_API_KEY, NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Yes | Gemini API key for chat |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Yes | Google Maps API key (Maps 3D, Routes, Solar) |

## CI/CD

- **PRs to main**: GitHub Actions runs lint + build
- **Push to main**: GitHub Actions validates, Railway auto-deploys to production
