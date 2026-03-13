<!-- Sync Impact Report
  Version change: 0.0.0 → 1.0.0 (initial ratification)
  Added principles:
    - I. Declarative React Patterns
    - II. Type Safety
    - III. Component Isolation
    - IV. API Key Security
    - V. User Experience First
  Added sections:
    - Technology Stack Constraints
    - Development Workflow
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ (no changes needed — generic)
    - .specify/templates/spec-template.md ✅ (no changes needed — generic)
    - .specify/templates/tasks-template.md ✅ (no changes needed — generic)
  Follow-up TODOs: none
-->

# SUSS AJE Constitution

## Core Principles

### I. Declarative React Patterns

All UI rendering MUST use React's declarative component model. Imperative DOM manipulation (createElement, appendChild, setAttribute) is FORBIDDEN except when wrapping third-party web components that have no React binding. When wrapping web components, the imperative code MUST be isolated inside a single wrapper component with a clean React props interface. External libraries with React bindings (e.g., `@vis.gl/react-google-maps`) MUST be preferred over raw web component manipulation.

### II. Type Safety

TypeScript strict mode is the standard. `as any`, `@ts-ignore`, and `@ts-expect-error` MUST NOT be used. Every component prop, hook return value, and API response MUST have explicit TypeScript interfaces defined in `src/types/index.ts` or co-located with the module. Zustand store slices MUST have fully typed interfaces.

### III. Component Isolation

Each component MUST have a single responsibility. Map rendering, street view, route overlay, and aerial view MUST be separate components. Hooks MUST encapsulate reusable logic (navigation, events, voice). Components MUST NOT duplicate logic that exists in hooks or utility functions. Dead code (unused components, hooks, functions) MUST be removed.

### IV. API Key Security

API keys MUST be accessed via `process.env.NEXT_PUBLIC_*` environment variables. Keys MUST NOT be committed to the repository. The application MUST degrade gracefully when API keys are missing — showing informative fallback UI rather than blank screens or cryptic errors. The `.env.local` file MUST be listed in `.gitignore`.

### V. User Experience First

The landing page MUST load within 3 seconds on standard broadband. Transitions between views (hero → app, map camera movements) MUST be smooth and animated. Loading states MUST always be visible — never show blank or frozen screens. The SUSS brand identity (#003B5C primary, Nunito Sans font) MUST be consistently applied across all components.

## Technology Stack Constraints

- **Framework**: Next.js 16 with App Router. All pages use `"use client"` where interactivity is required.
- **Styling**: Tailwind CSS 4 with OKLCH color tokens defined in `globals.css`. No inline style objects except for dynamic values that cannot be expressed as Tailwind classes.
- **State**: Zustand 5 as the single global store at `src/store/app-store.ts`. No prop drilling beyond one level — use the store for cross-component state.
- **Maps**: `@vis.gl/react-google-maps` for all Google Maps integration. `APIProvider` MUST wrap the map tree. Raw `gmp-*` web components are acceptable ONLY for elements without React bindings (e.g., `gmp-polyline-3d`).
- **AI**: Vercel AI SDK with Google Gemini. Tool definitions in `src/lib/ai/tools.ts`.
- **Voice**: Web Speech API wrappers in `src/lib/voice/`.
- **Icons**: Inline SVG or Lucide React. No icon font libraries.
- **Deploy**: Railway auto-deploy from `main` branch. GitHub Actions CI runs lint + build on all PRs.

## Development Workflow

- **Branch strategy**: Feature branches from `main`. Git worktrees for parallel development.
- **Commit messages**: Conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`, `ci:`).
- **Pre-merge gates**: ESLint clean, `next build` succeeds with zero errors.
- **Code review**: All changes to `src/components/` and `src/lib/` MUST be reviewed for adherence to Declarative React Patterns and Component Isolation principles.
- **Dead code policy**: Any component, hook, or utility function not imported anywhere MUST be removed before merge.

## Governance

This constitution governs all development decisions for the SUSS AJE project. When conflicts arise between speed and principles, principles win — technical debt from violated principles compounds faster than deadline pressure. Amendments to this constitution MUST document the rationale, increment the version, and update all dependent templates. All PRs and code reviews MUST verify compliance with these principles.

**Version**: 1.0.0 | **Ratified**: 2026-03-13 | **Last Amended**: 2026-03-13
