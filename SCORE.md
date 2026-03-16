# suss-aje Autoresearch Score

This file defines the KPIs and scoring function for autonomous improvement of suss-aje.
Inspired by karpathy/autoresearch: fixed metric, agent modifies code, keeps if improved.

## The Metric

**Composite Score (0–100) — HIGHER IS BETTER**

```
score = (
  ts_score      * 0.20 +   # TypeScript: 100 - (errors * 5), floored at 0
  lint_score    * 0.15 +   # ESLint: 100 - (errors * 5), floored at 0
  test_cov      * 0.30 +   # Test coverage: line coverage % (0–100)
  a11y_score    * 0.15 +   # A11y: 100 - (violations * 10), floored at 0
  perf_score    * 0.20     # Build: 100 if build succeeds + bundle size bonus
)
```

## Baseline (2026-03-14)

| KPI | Current | Target |
|-----|---------|--------|
| TypeScript errors | 3 | 0 |
| ESLint errors | 5 errors, 4 warnings | 0 errors |
| Test coverage (lines) | ~10% | 80% |
| A11y violations | ~6 components missing ARIA | 0 |
| Build | ✅ passes | ✅ + chunks < 200KB |

**Baseline Score: ~22/100**

## Target Score: 85/100

## What agents may modify

- `src/**/*.ts` and `src/**/*.tsx` — all source files
- `tests/**/*.ts` and `tests/**/*.tsx` — all test files
- `tsconfig.json` — TypeScript config
- `eslint.config.mjs` — lint rules
- DO NOT modify: `public/aac-events.json`, `public/campus-events.json`, `next.config.ts`

## How to measure

Run `./score.sh` from repo root. Outputs a JSON result and prints the composite score.

## Ralph Loop pattern

- **Worker**: Implements improvements (opencode in tmux)
- **Reviewer**: Evaluates score before/after, gives feedback (separate opencode session)
- **Memory**: `SCORE_HISTORY.md` — log of each iteration's score and what changed
- **Loop**: Continue until score ≥ 85 or 10 iterations
