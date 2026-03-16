#!/usr/bin/env bash
# suss-aje scoring script — autoresearch style
# Usage: ./score.sh
# Outputs: composite score 0-100 and breakdown

set -euo pipefail
cd "$(dirname "$0")"

echo "=== suss-aje Score v1 ==="
echo ""

# TypeScript
echo "▶ TypeScript check..."
TS_ERRORS=$(npx tsc --noEmit 2>&1 | grep -c "error TS" || true)
TS_SCORE=$(( 100 - TS_ERRORS * 5 ))
if [ "$TS_SCORE" -lt 0 ]; then TS_SCORE=0; fi
echo "  TypeScript errors: $TS_ERRORS → score: $TS_SCORE/100"

# Lint
echo "▶ ESLint check..."
LINT_ERRORS=$(npm run lint 2>&1 | grep -c "error" || true)
LINT_WARNINGS=$(npm run lint 2>&1 | grep -c "warning" || true)
LINT_SCORE=$(( 100 - LINT_ERRORS * 10 - LINT_WARNINGS * 2 ))
if [ "$LINT_SCORE" -lt 0 ]; then LINT_SCORE=0; fi
echo "  ESLint errors: $LINT_ERRORS, warnings: $LINT_WARNINGS → score: $LINT_SCORE/100"

# Test coverage
echo "▶ Test coverage..."
COV_OUT=$(npm run test:coverage 2>&1)
COVERAGE=$(echo "$COV_OUT" | grep "All files" | awk -F'|' '{gsub(/ /,"",$2); print $2}' | head -1)
COVERAGE=${COVERAGE%.*}
if [ -z "$COVERAGE" ]; then COVERAGE=0; fi
echo "  Line coverage: ${COVERAGE}% → score: $COVERAGE/100"

# A11y (static check: components without aria attrs)
echo "▶ A11y static check..."
A11Y_MISSING=$(grep -rL "aria-\|role=" src/components --include="*.tsx" 2>/dev/null | \
  grep -v "ui/\(card\|scroll-area\|sonner\|skeleton\|badge\|button\|input\|select\|tabs\).tsx" | \
  wc -l | tr -d ' ')
A11Y_SCORE=$(( 100 - A11Y_MISSING * 15 ))
if [ "$A11Y_SCORE" -lt 0 ]; then A11Y_SCORE=0; fi
echo "  Components missing ARIA: $A11Y_MISSING → score: $A11Y_SCORE/100"

# Build
echo "▶ Build check..."
BUILD_OK=0
if NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=dummy npm run build > /dev/null 2>&1; then
  BUILD_OK=100
  echo "  Build: ✅ → score: 100/100"
else
  echo "  Build: ❌ → score: 0/100"
fi

# Composite
echo ""
echo "=== COMPOSITE SCORE ==="
python3 -c "
ts=$TS_SCORE; lint=$LINT_SCORE; cov=$COVERAGE; a11y=$A11Y_SCORE; build=$BUILD_OK
score = ts*0.20 + lint*0.15 + cov*0.30 + a11y*0.15 + build*0.20
print(f'TypeScript:    {ts}/100  (×0.20 = {ts*0.20:.1f})')
print(f'ESLint:        {lint}/100  (×0.15 = {lint*0.15:.1f})')
print(f'Coverage:      {cov}/100  (×0.30 = {cov*0.30:.1f})')
print(f'A11y:          {a11y}/100  (×0.15 = {a11y*0.15:.1f})')
print(f'Build:         {build}/100  (×0.20 = {build*0.20:.1f})')
print(f'')
print(f'TOTAL SCORE:   {score:.1f}/100')
print(f'TARGET:        85/100')
print(f'GAP:           {85-score:.1f} points needed')
"
