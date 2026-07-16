# Position Floor Guardrails Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep collateral and loan adjustment controls interactive while preventing slider or manual input from moving a position below its displayed Locked or Repayable threshold.

**Architecture:** Extend the existing normalized slider-bounds result with a numeric `minimum` and fail closed at the current position when the requested floor consumes the range or is invalid. Both panels reuse that minimum for noUiSlider padding, direct-field minimums, and complementary-field maximums.

**Tech Stack:** React 18, TypeScript, BigNumber.js, noUiSlider 14, Node.js test runner, pnpm/Turborepo.

## Global Constraints

- Keep both sliders disabled only when `!isAdjusting`; do not reintroduce `hasMovableRange`.
- Preserve existing debt-ceiling increase restrictions, transaction guards, locking/repayable calculations, safety buffers, and decimal precision.
- Use one normalized minimum for the slider and both manual-input directions in each panel.
- Fully invalid slider inputs retain safe finite fallback options.

---

### Task 1: Preserve protected floors in normalized slider bounds

**Files:**
- Modify: `apps/web/src/store/collateral/eligibility.ts:28-86`
- Test: `apps/web/tests/collateralEligibility.test.ts:49-124`

**Interfaces:**
- Consumes: `getSafeSliderBounds(currentAmount: BigNumber, maximum: BigNumber, requestedMinimum: BigNumber, decimalPlaces: number)`
- Produces: `SafeSliderBounds` with `start: number`, `minimum: number`, `maximum: number`, and `padding: [number, number]`.

- [ ] **Step 1: Write failing normalized-floor tests**

Update every expected bounds object to include `minimum`. Consumed ranges must expect the current position as the floor:

```ts
assert.deepEqual(getSafeSliderBounds(new BigNumber('605.31'), new BigNumber('605.31'), new BigNumber('605.32'), 2), {
  start: 605.31,
  minimum: 605.31,
  maximum: 605.31,
  padding: [605.31, 0],
});
```

Valid floors keep the requested minimum:

```ts
assert.deepEqual(getSafeSliderBounds(new BigNumber('605.31'), new BigNumber('605.31'), new BigNumber('500'), 2), {
  start: 605.31,
  minimum: 500,
  maximum: 605.31,
  padding: [500, 0],
});
```

Negative and `NaN` requested floors fail closed at the current position:

```ts
assert.deepEqual(getSafeSliderBounds(new BigNumber(10), new BigNumber(20), new BigNumber(-1), 2), {
  start: 10,
  minimum: 10,
  maximum: 20,
  padding: [10, 0],
});
```

The fully invalid fallback remains `start: 0`, `minimum: 0`, `maximum: 0.001`, and `padding: [0, 0]`.

- [ ] **Step 2: Run the focused test and verify RED**

```bash
/Users/hetfly/.nvm/versions/node/v22.21.1/bin/node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test apps/web/tests/collateralEligibility.test.ts
```

Expected: FAIL because the helper does not return `minimum` and still returns zero padding for consumed or invalid requested floors.

- [ ] **Step 3: Implement the normalized protected minimum**

Extend the result type:

```ts
export type SafeSliderBounds = {
  start: number;
  minimum: number;
  maximum: number;
  padding: [number, number];
};
```

Include `minimum: 0` in the fully invalid fallback. For valid current and maximum values, replace the zero-padding collapsed branches with:

```ts
const minimum =
  roundedRequestedMinimum.isFinite() && !roundedRequestedMinimum.isNegative()
    ? BigNumber.min(roundedRequestedMinimum, roundedCurrentAmount).toNumber()
    : start;
const safeMinimum = Number.isFinite(minimum) ? minimum : start;

return {
  start,
  minimum: safeMinimum,
  maximum: numericMaximum,
  padding: [safeMinimum, 0],
};
```

The earlier `start > numericMaximum` validation guarantees the normalized floor cannot exceed the maximum after it is capped at the current amount.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run the same Node 22 command. Expected: all focused tests pass.

- [ ] **Step 5: Commit the slider-floor repair**

```bash
git add apps/web/src/store/collateral/eligibility.ts apps/web/tests/collateralEligibility.test.ts
git commit -m "fix: preserve protected slider floors"
```

### Task 2: Clamp direct and complementary manual inputs

**Files:**
- Modify: `apps/web/src/app/components/home/CollateralPanel.tsx:158-180,490-520`
- Modify: `apps/web/src/app/components/home/LoanPanel.tsx:64-78,338-380`
- Test: `apps/web/tests/collateralEligibility.test.ts:180-225`

**Interfaces:**
- Consumes: `collateralSliderBounds.minimum` and `loanSliderBounds.minimum` from Task 1.
- Produces: `CurrencyField` bounds that enforce the same floor as each panel's slider.

- [ ] **Step 1: Write failing panel-wiring tests**

Add these source assertions while retaining checks for `disabled={!isAdjusting}`, normalized padding, and the absence of `hasMovableRange`:

```ts
assert.match(collateralPanelSource, /const collateralMinimum = new BigNumber\(collateralSliderBounds\.minimum\)/);
assert.match(collateralPanelSource, /const walletMaximum = BigNumber\.max\(collateralTotal\.minus\(collateralMinimum\), 0\)/);
assert.match(collateralPanelSource, /label="Deposited"[\s\S]*?minValue=\{collateralMinimum\}/);
assert.match(collateralPanelSource, /label="Wallet"[\s\S]*?maxValue=\{walletMaximum\}/);

assert.match(loanPanelSource, /const loanMinimum = new BigNumber\(loanSliderBounds\.minimum\)/);
assert.match(loanPanelSource, /const availableMaximum = BigNumber\.max\(borrowableAmountWithReserve\.minus\(loanMinimum\), 0\)/);
assert.match(loanPanelSource, /label="Borrowed"[\s\S]*?minValue=\{loanMinimum\}/);
assert.match(loanPanelSource, /label="Available"[\s\S]*?maxValue=\{availableMaximum\}/);
```

- [ ] **Step 2: Run the focused test and verify RED**

Run the Node 22 focused-test command. Expected: FAIL only on the new manual-input assertions.

- [ ] **Step 3: Wire collateral manual-input bounds**

After computing `collateralSliderBounds`, add:

```ts
const collateralMinimum = new BigNumber(collateralSliderBounds.minimum);
const walletMaximum = BigNumber.max(collateralTotal.minus(collateralMinimum), 0);
```

Pass `minValue={collateralMinimum}` to Deposited and replace Wallet's `maxValue={collateralTotal}` with `maxValue={walletMaximum}`.

- [ ] **Step 4: Wire loan manual-input bounds**

After computing `loanSliderBounds`, add:

```ts
const loanMinimum = new BigNumber(loanSliderBounds.minimum);
const availableMaximum = BigNumber.max(borrowableAmountWithReserve.minus(loanMinimum), 0);
```

Pass `minValue={loanMinimum}` to both Borrowed render branches and `maxValue={availableMaximum}` to Available.

- [ ] **Step 5: Run the focused test and verify GREEN**

Run the Node 22 focused-test command. Expected: all focused tests pass.

- [ ] **Step 6: Commit the manual-input repair**

```bash
git add apps/web/src/app/components/home/CollateralPanel.tsx apps/web/src/app/components/home/LoanPanel.tsx apps/web/tests/collateralEligibility.test.ts
git commit -m "fix: clamp protected position inputs"
```

### Task 3: Verify the exact committed implementation

**Files:**
- Verify: `apps/web/src/store/collateral/eligibility.ts`
- Verify: `apps/web/src/app/components/home/CollateralPanel.tsx`
- Verify: `apps/web/src/app/components/home/LoanPanel.tsx`
- Verify: `apps/web/tests/collateralEligibility.test.ts`

**Interfaces:**
- Consumes: completed normalized bounds and panel wiring.
- Produces: verification evidence for the committed branch; no new production interface.

- [ ] **Step 1: Run focused regression tests**

```bash
/Users/hetfly/.nvm/versions/node/v22.21.1/bin/node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test apps/web/tests/collateralEligibility.test.ts
```

Expected: zero failures.

- [ ] **Step 2: Run repository TypeScript checks**

```bash
pnpm checkTs
```

Expected: all six packages pass.

- [ ] **Step 3: Build the production web application**

```bash
pnpm build
```

Expected: the web build succeeds. Existing Vite dependency and chunk-size warnings may remain.

- [ ] **Step 4: Verify scope and repository state**

```bash
git diff --check
if rg -n "hasMovableRange" apps/web/src apps/web/dist; then exit 1; fi
git status --short
```

Expected: no whitespace errors, no `hasMovableRange` matches in source or built output, and a clean worktree.
