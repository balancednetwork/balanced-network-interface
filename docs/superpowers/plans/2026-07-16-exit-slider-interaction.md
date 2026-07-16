# Exit Slider Interaction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore collateral withdrawal and loan repayment slider interaction by removing the recently added frontend movability gate.

**Architecture:** Keep `getSafeSliderBounds()` responsible for normalized noUiSlider start, maximum, and padding values, including its existing collapsed-range fallback. Remove `hasMovableRange` from the helper contract and make both sliders depend only on panel adjustment state for their disabled state.

**Tech Stack:** React, TypeScript, BigNumber.js, noUiSlider, Node.js built-in test runner, pnpm/Turborepo.

## Global Constraints

- Preserve the long-standing collateral lock padding calculation.
- Preserve the long-standing loan repayment padding calculation.
- Preserve normalized noUiSlider start, maximum, and fallback values.
- Collateral and loan sliders are disabled only when `isAdjusting` is false.
- Remove `hasMovableRange` from all production code.
- Preserve zero-ceiling action maximums, disabled-increase guards, and contract calls.
- Do not redesign either panel or its lock indicators.

---

### Task 1: Remove frontend exit slider gating

**Files:**
- Modify: `apps/web/tests/collateralEligibility.test.ts`
- Modify: `apps/web/src/store/collateral/eligibility.ts`
- Modify: `apps/web/src/app/components/home/CollateralPanel.tsx`
- Modify: `apps/web/src/app/components/home/LoanPanel.tsx`

**Interfaces:**
- Consumes: `getSafeSliderBounds(currentAmount, maximum, requestedMinimum, decimalPlaces)`.
- Produces: `SafeSliderBounds = { start: number; maximum: number; padding: [number, number] }` and sliders disabled only by `isAdjusting`.

- [ ] **Step 1: Change the focused tests to the required behavior**

In `apps/web/tests/collateralEligibility.test.ts`, remove every `hasMovableRange` property from the expected `getSafeSliderBounds()` results.

Change the panel wiring assertions to:

```ts
test('collateral and loan panels use safe slider bounds without frontend movability gating', async () => {
  const collateralPanelSource = await readFile(
    new URL('../src/app/components/home/CollateralPanel.tsx', import.meta.url),
    'utf8',
  );
  const loanPanelSource = await readFile(new URL('../src/app/components/home/LoanPanel.tsx', import.meta.url), 'utf8');

  assert.match(collateralPanelSource, /collateralSliderBounds\.padding/);
  assert.match(collateralPanelSource, /start=\{collateralSliderBounds\.start\}/);
  assert.match(collateralPanelSource, /max: \[collateralSliderBounds\.maximum\]/);
  assert.match(collateralPanelSource, /disabled=\{!isAdjusting\}/);

  assert.match(loanPanelSource, /loanSliderBounds\.padding/);
  assert.match(loanPanelSource, /start=\{\[loanSliderBounds\.start\]\}/);
  assert.match(loanPanelSource, /max: \[loanSliderBounds\.maximum\]/);
  assert.match(loanPanelSource, /disabled=\{!isAdjusting\}/);

  assert.doesNotMatch(collateralPanelSource, /hasMovableRange/);
  assert.doesNotMatch(loanPanelSource, /hasMovableRange/);
});
```

Extend the test to read `../src/store/collateral/eligibility.ts` and assert:

```ts
assert.doesNotMatch(eligibilitySource, /hasMovableRange/);
```

Keep the existing assertions that adjustment controls remain visible and handlers do not return early, but replace their slider-disabled assertions with `disabled={!isAdjusting}`.

- [ ] **Step 2: Run the focused suite and verify RED**

Run:

```bash
/Users/hetfly/.nvm/versions/node/v22.21.1/bin/node \
  --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
  --test apps/web/tests/collateralEligibility.test.ts
```

Expected: FAIL because helper results still contain `hasMovableRange`, both panels still reference it, and both sliders still include it in their disabled expressions.

- [ ] **Step 3: Remove `hasMovableRange` from the helper contract**

Change `SafeSliderBounds` in `apps/web/src/store/collateral/eligibility.ts` to:

```ts
export type SafeSliderBounds = {
  start: number;
  maximum: number;
  padding: [number, number];
};
```

Remove `hasMovableRange` from the invalid fallback, collapsed fallback, and valid return objects. Do not change any calculations, arguments, or other returned values.

- [ ] **Step 4: Restore adjustment-only slider disabling**

In `apps/web/src/app/components/home/CollateralPanel.tsx`, change:

```tsx
disabled={!isAdjusting || !collateralSliderBounds.hasMovableRange}
```

to:

```tsx
disabled={!isAdjusting}
```

In `apps/web/src/app/components/home/LoanPanel.tsx`, change:

```tsx
disabled={!isAdjusting || !loanSliderBounds.hasMovableRange}
```

to:

```tsx
disabled={!isAdjusting}
```

Do not change either panel's `padding`, `start`, `maximum`, action maximum, confirmation guards, or transaction handlers.

- [ ] **Step 5: Run the focused suite and verify GREEN**

Run the Node 22 command from Step 2.

Expected: all 13 tests pass, including safe fallback, position visibility, disabled-increase guard, and slider-interaction coverage.

- [ ] **Step 6: Run workspace verification**

Run:

```bash
pnpm checkTs
pnpm build
git diff --check
```

Expected: all six TypeScript checks pass, the production web build succeeds, and no whitespace errors are reported. Existing dependency and Browserslist warnings may remain unchanged.

- [ ] **Step 7: Verify the production bundle wiring**

Inspect the generated web assets and confirm the collateral and loan noUiSlider instances retain normalized padding/start/maximum wiring without a movability-based disabled condition:

```bash
rg -n "hasMovableRange" apps/web/dist apps/web/src/store/collateral/eligibility.ts \
  apps/web/src/app/components/home/CollateralPanel.tsx \
  apps/web/src/app/components/home/LoanPanel.tsx
```

Expected: no matches.

- [ ] **Step 8: Commit the hotfix**

```bash
git add \
  apps/web/tests/collateralEligibility.test.ts \
  apps/web/src/store/collateral/eligibility.ts \
  apps/web/src/app/components/home/CollateralPanel.tsx \
  apps/web/src/app/components/home/LoanPanel.tsx
git commit -m "fix: restore exit slider interaction"
```
