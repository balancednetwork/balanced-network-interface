# Zero-ceiling slider crash hotfix implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent invalid noUiSlider bounds from crashing accounts with zero-ceiling positions while preserving every valid repayment and collateral-withdrawal path.

**Architecture:** Add one pure helper that normalizes the slider's protected lower padding and reports whether the range contains any valid movement. Both home position panels will derive their adjustment availability and noUiSlider padding from that helper, while the existing transaction guards continue to prohibit deposits and borrowing for zero-ceiling assets.

**Tech Stack:** React, TypeScript, BigNumber.js, noUiSlider 14.6.4, Node.js built-in test runner, pnpm/Turborepo.

## Global Constraints

- Never pass noUiSlider padding that is equal to or greater than the slider range.
- Existing debt remains repayable whenever the selected network provides a positive repayment range.
- Existing collateral remains withdrawable whenever the position has unlocked collateral.
- Zero-ceiling positions cannot increase collateral deposits or debt.
- Collapsed or non-finite ranges render safely and fail closed.
- Do not change positive-ceiling transaction eligibility.

---

### Task 1: Normalize protected slider bounds

**Files:**
- Modify: `apps/web/src/store/collateral/eligibility.ts`
- Test: `apps/web/tests/collateralEligibility.test.ts`

**Interfaces:**
- Consumes: `BigNumber` maximum and requested protected minimum, plus the displayed decimal precision.
- Produces: `getSafeSliderBounds(maximum: BigNumber, requestedMinimum: BigNumber, decimalPlaces: number): { padding: [number, number]; hasMovableRange: boolean }`.

- [ ] **Step 1: Write failing helper tests**

Add cases to `apps/web/tests/collateralEligibility.test.ts`:

```ts
test('collapses slider bounds when protected minimum consumes the range', async () => {
  const { getSafeSliderBounds } = await import('../src/store/collateral/eligibility.ts');

  assert.deepEqual(
    getSafeSliderBounds(new BigNumber('605.31'), new BigNumber('605.32'), 2),
    { padding: [0, 0], hasMovableRange: false },
  );
  assert.deepEqual(
    getSafeSliderBounds(new BigNumber('605.31'), new BigNumber('605.31'), 2),
    { padding: [0, 0], hasMovableRange: false },
  );
});

test('preserves valid repayment and withdrawal slider ranges', async () => {
  const { getSafeSliderBounds } = await import('../src/store/collateral/eligibility.ts');

  assert.deepEqual(
    getSafeSliderBounds(new BigNumber('605.31'), new BigNumber('500'), 2),
    { padding: [500, 0], hasMovableRange: true },
  );
  assert.deepEqual(
    getSafeSliderBounds(new BigNumber('237.736999'), new BigNumber('32.97'), 6),
    { padding: [32.97, 0], hasMovableRange: true },
  );
});

test('fails closed for invalid slider bounds', async () => {
  const { getSafeSliderBounds } = await import('../src/store/collateral/eligibility.ts');

  assert.deepEqual(
    getSafeSliderBounds(new BigNumber(0), new BigNumber(0), 2),
    { padding: [0, 0], hasMovableRange: false },
  );
  assert.deepEqual(
    getSafeSliderBounds(new BigNumber(Number.POSITIVE_INFINITY), new BigNumber(0), 2),
    { padding: [0, 0], hasMovableRange: false },
  );
});
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test apps/web/tests/collateralEligibility.test.ts
```

Expected: FAIL because `getSafeSliderBounds` is not exported.

- [ ] **Step 3: Implement the minimal helper**

Add to `apps/web/src/store/collateral/eligibility.ts`:

```ts
export type SafeSliderBounds = {
  padding: [number, number];
  hasMovableRange: boolean;
};

export function getSafeSliderBounds(
  maximum: BigNumber,
  requestedMinimum: BigNumber,
  decimalPlaces: number,
): SafeSliderBounds {
  const roundedMaximum = maximum.dp(decimalPlaces);
  const roundedMinimum = BigNumber.max(requestedMinimum.dp(decimalPlaces), 0);

  if (
    !roundedMaximum.isFinite() ||
    !roundedMinimum.isFinite() ||
    roundedMaximum.isLessThanOrEqualTo(0) ||
    roundedMinimum.isGreaterThanOrEqualTo(roundedMaximum)
  ) {
    return { padding: [0, 0], hasMovableRange: false };
  }

  return {
    padding: [roundedMinimum.toNumber(), 0],
    hasMovableRange: true,
  };
}
```

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run the command from Step 2.

Expected: all eligibility tests pass.

- [ ] **Step 5: Commit the helper and tests**

```bash
git add apps/web/src/store/collateral/eligibility.ts apps/web/tests/collateralEligibility.test.ts
git commit -m "fix: normalize zero ceiling slider bounds"
```

---

### Task 2: Wire safe bounds into collateral and loan panels

**Files:**
- Modify: `apps/web/src/app/components/home/CollateralPanel.tsx`
- Modify: `apps/web/src/app/components/home/LoanPanel.tsx`
- Test: `apps/web/tests/collateralEligibility.test.ts`

**Interfaces:**
- Consumes: `getSafeSliderBounds` from Task 1.
- Produces: noUiSlider configurations whose padding is always valid, plus adjustment controls that remain enabled exactly when their real ranges can move.

- [ ] **Step 1: Write failing source-wiring tests**

Extend the existing source-wiring test with assertions that both panels import and call `getSafeSliderBounds`, pass `.padding` to noUiSlider, and use `.hasMovableRange` for adjustment availability:

```ts
assert.match(collateralPanelSource, /getSafeSliderBounds/);
assert.match(collateralPanelSource, /collateralSliderBounds\.padding/);
assert.match(collateralPanelSource, /collateralSliderBounds\.hasMovableRange/);
assert.match(loanPanelSource, /getSafeSliderBounds/);
assert.match(loanPanelSource, /loanSliderBounds\.padding/);
assert.match(loanPanelSource, /loanSliderBounds\.hasMovableRange/);
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test apps/web/tests/collateralEligibility.test.ts
```

Expected: FAIL because neither panel consumes the new helper yet.

- [ ] **Step 3: Wire the collateral panel**

Import `getSafeSliderBounds`. Cap the requested protected minimum at the current deposit, derive bounds before `canAdjustCollateral`, and use them in the UI:

```ts
const tLockedAmount = React.useMemo(
  () => BigNumber.min(lockedCollateral.times(shouldShowLock ? 1.005 : 1), collateralDeposit),
  [lockedCollateral, collateralDeposit, shouldShowLock],
);
const collateralSliderBounds = getSafeSliderBounds(
  actionMaximum,
  tLockedAmount,
  collateralDecimalPlaces,
);
const canAdjustCollateral = collateralSliderBounds.hasMovableRange;
```

Configure noUiSlider with:

```tsx
disabled={!isAdjusting || !collateralSliderBounds.hasMovableRange}
padding={collateralSliderBounds.padding}
```

Keep `actionMaximum`, `isIncreaseAllowed`, and the transaction-handler increase guards unchanged.

- [ ] **Step 4: Wire the loan panel**

Import `getSafeSliderBounds`, move the existing `activeLoanAccount` and `usedAmount` derivation next to `actionMaximum`, and derive:

```ts
const loanSliderBounds = getSafeSliderBounds(actionMaximum, usedAmount, 2);
const canAdjustLoan = loanSliderBounds.hasMovableRange;
```

Configure noUiSlider with:

```tsx
disabled={!isAdjusting || !loanSliderBounds.hasMovableRange}
padding={loanSliderBounds.padding}
```

Keep `actionMaximum`, `isIncreaseAllowed`, and the transaction-handler increase guards unchanged.

- [ ] **Step 5: Run focused tests and TypeScript checks**

Run:

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test apps/web/tests/collateralEligibility.test.ts
pnpm checkTs
```

Expected: all focused tests pass and all six workspace type-check tasks succeed.

- [ ] **Step 6: Commit panel integration**

```bash
git add apps/web/src/app/components/home/CollateralPanel.tsx apps/web/src/app/components/home/LoanPanel.tsx apps/web/tests/collateralEligibility.test.ts
git commit -m "fix: prevent collapsed position slider crashes"
```

---

### Task 3: Verify the production hotfix behavior

**Files:**
- Verify only; no planned source changes.

**Interfaces:**
- Consumes: completed Tasks 1 and 2.
- Produces: evidence that the reported crash condition is fixed without regressing exit actions.

- [ ] **Step 1: Run the complete focused regression suite**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test apps/web/tests/collateralEligibility.test.ts
```

Expected: all tests pass, including the exact `605.32 padding / 605.31 maximum` regression.

- [ ] **Step 2: Run static and build verification**

```bash
pnpm checkTs
pnpm --filter web lint
pnpm --filter web build
git diff --check
```

Expected: type checks and build succeed, lint has no new warnings, and `git diff --check` prints nothing.

- [ ] **Step 3: Run browser smoke verification**

Start the local frontend and inspect the home page in the browser. Confirm:

- the page renders without a noUiSlider exception;
- all registered collateral types remain listed;
- a movable zero-ceiling position exposes its decreasing adjustment path; and
- a collapsed position renders without a white screen or enabled invalid adjustment.

- [ ] **Step 4: Review the final diff and repository state**

```bash
git status --short
git log --oneline -6
```

Expected: the worktree is clean and the two hotfix commits are at `HEAD`.
