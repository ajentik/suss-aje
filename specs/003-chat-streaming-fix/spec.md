# Spec 003: Fix Chat Streaming & Tool Result Rendering

## Problem
Chat streaming has issues:
1. When Gemini calls a tool and stops (no follow-up text), the UI shows nothing — tool output isn't rendered as chat messages
2. `extractMessageContent` falls back to tool output but formatting is plain text
3. No streaming indicators during tool execution
4. Error handling is basic — toast only, no inline error display
5. Tool results (navigate, events, campus_info) should render as rich cards, not raw text

## Solution

### US-1: Tool Result Cards
- When `navigate_to` returns a POI, render a location card with name, description, category icon
- When `show_events` returns events, render event cards inline in chat
- When `campus_info` returns venues, render a venue list card

### US-2: Streaming UX
- Show "Thinking..." skeleton during tool execution
- Show typing indicator with animated dots during text streaming
- Smooth scroll-to-bottom during streaming (already partially implemented but buggy)

### US-3: Error Resilience
- Inline error display in chat (not just toast)
- Retry button on failed messages
- Handle network disconnects gracefully

### US-4: Multi-turn Tool Use
- Support consecutive tool calls (navigate → show_events) in single response
- Render each tool result as separate card in message flow

## Affected Files
- `src/components/chat/ChatPanel.tsx` — tool result rendering
- `src/components/chat/ChatMessage.tsx` — rich card components
- `src/components/chat/ToolResultCard.tsx` — NEW: reusable tool result cards
- `src/app/api/chat/route.ts` — error handling improvements
