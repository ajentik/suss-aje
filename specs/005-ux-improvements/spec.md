# Spec 005: UX Improvements — Mobile, A11y, Quick Actions

## Problem
Current UX has gaps:
1. Mobile layout is cramped — map and chat fight for space
2. No quick action buttons for common queries
3. Accessibility is minimal (no ARIA labels on map controls, no keyboard nav in chat)
4. No onboarding flow — new users don't know what to ask
5. Dark mode support incomplete
6. No conversation history persistence

## Solution

### US-1: Mobile-First Responsive Layout
- Bottom sheet pattern for chat on mobile (swipe up/down)
- Full-screen map by default on mobile, chat overlays
- Collapsible panels with touch-friendly handles
- Proper viewport handling (dvh for mobile Safari)

### US-2: Quick Action Chips
- Horizontal scrollable chip bar above chat input
- Suggestions: "🗺️ Campus Map", "📅 Events Today", "🍔 Where to Eat", "📚 Library Hours", "🚌 Shuttle Schedule", "🏥 Nearest AAC"
- Chips send pre-composed messages to chat
- Contextual chips based on time (morning: "breakfast spots", evening: "open now")

### US-3: Accessibility
- ARIA labels on all interactive elements
- Keyboard navigation in chat (Enter to send, Tab to cycle)
- Screen reader announcements for new messages
- Focus management when panels open/close
- Reduced motion support

### US-4: Onboarding & Welcome
- First-visit welcome message with capability overview
- Animated examples of what AskSUSSi can do
- "Try asking..." suggestions that rotate
- Dismiss/don't show again preference (persisted)

### US-5: Conversation Persistence
- Save chat history to localStorage via Zustand persist
- "New Chat" button to start fresh
- Last 5 conversations accessible

### US-6: Dark Mode & Theme Polish
- Complete dark mode support for all components
- SUSS brand colours in both light/dark themes
- Smooth theme transitions
- System preference detection

## Affected Files
- `src/components/layout/AppShell.tsx` — responsive layout
- `src/components/chat/ChatPanel.tsx` — quick actions, persistence
- `src/components/chat/QuickActions.tsx` — NEW: chip bar
- `src/components/layout/MobileSheet.tsx` — NEW: mobile bottom sheet
- `src/components/layout/Onboarding.tsx` — NEW: welcome flow
- `src/store/app-store.ts` — conversation history
- `src/app/globals.css` — dark mode tokens
