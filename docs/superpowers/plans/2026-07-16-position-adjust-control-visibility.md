# Position Adjustment Control Visibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the collateral and loan adjustment controls visible and enterable for existing positions without weakening slider safety or disabled-increase transaction guards.

**Architecture:** Decouple the panels' control rendering and adjustment handlers from `SafeSliderBounds.hasMovableRange`. Continue using normalized bounds only to disable noUiSlider when it cannot move, while preserving direct amount entry, confirmation guards, transaction guards, and contract enforcement.

**Tech Stack:** React, TypeScript, BigNumber.js, noUiSlider, Node.js built-in test runner, pnpm/Turborepo.

## Global Constraints

- Existing collateral positions expose their adjustment controls whenever a wallet is connected and the selected position has a positive total.
- Existing loan positions expose their adjustment controls whenever the loan panel is rendered for a connected account.
- Collapsed slider ranges do not prevent entering adjustment mode.
- Collapsed or invalid slider ranges remain disabled and receive only normalized noUiSlider options.
- Debt-ceiling eligibility, action maximums, confirmation guards, transaction guards, and contract behavior remain unchanged.
- Do not add new interface copy or redesign either panel.

---

### Task 1: Decouple adjustment controls from slider movability

**Files:**
- Modify: `apps/web/tests/collateralEligibility.test.ts`
- Modify: `apps/web/src/app/components/home/CollateralPanel.tsx`
- Modify: `apps/web/src/app/components/home/LoanPanel.tsx`

**Interfaces:**
- Consumes: `SafeSliderBounds.hasMovableRange` from `apps/web/src/store/collateral/eligibility.ts` for noUiSlider's disabled state only.
- Produces: Collateral and loan panel controls whose visibility and click handlers do not depend on slider movability.

- [ ] **Step 1: Write the failing control-visibility regression test**

Append this test to `apps/web/tests/collateralEligibility.test.ts`:

```ts
test('position adjustment controls are independent of slider movability', async () => {
  const collateralPanelSource = await readFile(
    new URL('../src/app/components/home/CollateralPanel.tsx', import.meta.url),
    'utf8',
  );
  const loanPanelSource = await readFile(new URL('../src/app/components/home/LoanPanel.tsx', import.meta.url), 'utf8');

  assert.doesNotMatch(collateralPanelSource, /const canAdjustCollateral =/);
  assert.doesNotMatch(collateralPanelSource, /if \(!canAdjustCollateral\) return/);
  assert.match(collateralPanelSource, /account && collateralTotal\?\.isGreaterThan\(0\) && \(/);
  assert.match(collateralPanelSource, /disabled=\{!isAdjusting \|\| !collateralSliderBounds\.hasMovableRange\}/);

  assert.doesNotMatch(loanPanelSource, /const canAdjustLoan =/);
  assert.doesNotMatch(loanPanelSource, /if \(!canAdjustLoan\) return/);
  assert.match(loanPanelSource, /\{account && \(/);
  assert.match(loanPanelSource, /disabled=\{!isAdjusting \|\| !loanSliderBounds\.hasMovableRange\}/);
});
```

- [ ] **Step 2: Run the focused suite and verify RED**

Run:

```bash
/Users/hetfly/.nvm/versions/node/v22.21.1/bin/node \
  --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
  --test apps/web/tests/collateralEligibility.test.ts
```

Expected: the new test fails because both panels still declare `canAdjust*`, both handlers still return early, and both control containers still include the `canAdjust*` render condition.

- [ ] **Step 3: Remove collateral control gating**

In `apps/web/src/app/components/home/CollateralPanel.tsx`, delete:

```ts
const canAdjustCollateral = collateralSliderBounds.hasMovableRange;
```

Change the adjustment handler to:

```ts
const handleEnableAdjusting = () => {
  adjust(true);
  adjustLoan(false);
};
```

Change the control render condition to:

```tsx
{account && collateralTotal?.isGreaterThan(0) && (
```

Keep this slider safety condition unchanged:

```tsx
disabled={!isAdjusting || !collateralSliderBounds.hasMovableRange}
```

- [ ] **Step 4: Remove loan control gating**

In `apps/web/src/app/components/home/LoanPanel.tsx`, delete:

```ts
const canAdjustLoan = loanSliderBounds.hasMovableRange;
```

Change the adjustment handler to:

```ts
const handleEnableAdjusting = () => {
  adjust(true);
  adjustCollateral(false);
};
```

Change the control render condition to:

```tsx
{account && (
```

Keep this slider safety condition unchanged:

```tsx
disabled={!isAdjusting || !loanSliderBounds.hasMovableRange}
```

- [ ] **Step 5: Run the focused suite and verify GREEN**

Run the Node 22 command from Step 2.

Expected: all 13 tests pass, including the new control-visibility regression test and the existing transaction-guard tests.

- [ ] **Step 6: Run workspace verification**

Run:

```bash
pnpm checkTs
pnpm build
git diff --check
```

Expected: all six TypeScript tasks succeed, the production web build completes, and `git diff --check` reports no whitespace errors.

- [ ] **Step 7: Commit the implementation**

```bash
git add \
  apps/web/tests/collateralEligibility.test.ts \
  apps/web/src/app/components/home/CollateralPanel.tsx \
  apps/web/src/app/components/home/LoanPanel.tsx
git commit -m "fix: keep position adjustment controls visible"
```
