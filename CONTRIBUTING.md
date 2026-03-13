# Contributing

Thanks for contributing to SUSS AJE.

## Prerequisites

- Node.js 24
- npm

## Getting Started

1. Clone the repository.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env.local
   ```

   Add required keys to `.env.local`.

4. Start development server:

   ```bash
   npm run dev
   ```

## Design System Rules

- Use only CSS custom properties defined in `src/app/globals.css` for colors.
- Never hard-code color values (`#hex`, `rgb`, etc.) in components.
- Use icons from `lucide-react`; do not add inline SVGs.
- Place reusable UI components in `src/components/ui/`.
- Add new UI primitives via shadcn CLI:

  ```bash
  npx shadcn@latest add <component>
  ```

## Code Style

- TypeScript strict mode is required.
- Do not use `any`.
- Do not use `@ts-ignore`.

## Accessibility

- All interactive elements must include meaningful `aria-label` values.
- Test keyboard navigation for all new interactions.

## Pull Request Process

1. Create your branch from `main`.
2. Run checks before opening a PR:

   ```bash
   npm run lint && npm run build
   ```

3. Use the PR template and complete its checklist.
