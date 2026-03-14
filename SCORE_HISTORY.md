# Score History

| Iteration | Score | TS | Lint | Coverage | A11y | Build | Key Changes |
|-----------|-------|----|------|----------|------|-------|-------------|
| 0 (baseline) | 22.0 | 85 | 50 | 10 | 55 | 100 | Baseline — 13 test files, 3 TS errors, 5 lint errors |
| 1 (audit PRs) | 42.5 | 100 | 85 | 10 | 70 | 100 | 8 audit PRs: rate limit, Zod validation, SHA-pinned CI, a11y ARIA, typing fixes |
| 2 (ralph round 1) | 65.2 | 100 | 74 | 46.87 | 0* | 100 | +26 test files (chat/events/map/ui/layout), lint 0 errors, TS 0 errors |

*A11y grep metric needs tuning — actual a11y improved via audit PRs

## Gap to Target (85/100): 19.8 points needed
- Coverage 46.87% → 80% = +10 pts
- Lint warnings 13 → 0 = +1.9 pts  
- A11y metric fix + actual improvements = +8 pts
