# Collateral Dropdown Sorting and ICX Crash Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make collateral ordering match the displayed values, default to the largest loan, and prevent ICX selection from crashing on invalid slider bounds.

**Architecture:** Move dropdown ordering and slider normalization into two small pure modules with Node regression tests. Keep React components responsible for state and rendering, consuming the tested values without adding token-specific exceptions.

**Tech Stack:** TypeScript 5.5, React 18, BigNumber.js 9, noUiSlider 14, Node 22 test runner, pnpm 9, Turborepo 2.

**Spec:** `docs/superpowers/specs/2026-10-23-collateral-dropdown-sorting-and-icx-crash-design.md`

## Global Constraints

- Default every collateral dropdown instance to `{ key: 'loan', order: 'DESC' }`.
- All-tab collateral ordering uses raw token amounts; Your-tab ordering keeps oracle-denominated values.
- Missing Your-tab prices contribute zero rather than short-circuiting the comparator.
- Do not special-case afSUI or ICX.
- Do not change transaction permissions, debt-ceiling behavior, or displayed values.
- Every production change follows a witnessed RED-to-GREEN test cycle.

## Review Focus

- Equal names, collateral amounts, or loans must produce comparator equality rather than unstable ordering; cover in Task 1.
- Potential Your-tab balances must remain secondary to actual deposited balances; cover in Task 1.
- A missing price in Your must not pin the row; cover in Task 1.
- A protected minimum equal to or above the maximum must never reach noUiSlider as full-range padding; cover in Task 2.
- Non-finite and oversized numeric inputs must fall back to finite slider options; cover in Task 2.

---

### Task 1: Collateral dropdown ordering

**Files:**
- Create: `apps/web/src/hooks/xCollateralSort.ts`
- Create: `apps/web/tests/xCollateralSort.test.ts`
- Modify: `apps/web/src/hooks/useSortXCollateralTypes.ts`
- Modify: `apps/web/src/app/components/CollateralTypeSwitcher/CollateralTypeList.tsx`

**Interfaces:**
- Produces: `DEFAULT_X_COLLATERAL_SORT: SortingType`.
- Produces: `sortXCollateralTypes(data, tab, sortBy, prices, canSortPositions): XPositionsRecord[]`.
- Consumes: `XPositionsRecord`, `CollateralTab`, oracle price records, and the existing `SortingType`.

- [ ] **Step 1: Write focused tests for the default, loan ordering, raw All-tab collateral ordering in both directions, missing Your-tab prices, actual-before-potential behavior, and equal values.**

- [ ] **Step 2: Run `node --experimental-strip-types --test apps/web/tests/xCollateralSort.test.ts` and confirm failures because the pure sorter does not exist.**

- [ ] **Step 3: Implement the pure sorter and default constant, then delegate the hook to them and remove the component's signed-in-dependent initial state.**

- [ ] **Step 4: Re-run the focused test and expect every test to pass.**

- [ ] **Step 5: Commit with `fix: correct collateral dropdown sorting`.**

### Task 2: Safe position slider bounds

**Files:**
- Create: `apps/web/src/utils/sliderBounds.ts`
- Create: `apps/web/tests/sliderBounds.test.ts`
- Modify: `apps/web/src/app/components/home/CollateralPanel.tsx`
- Modify: `apps/web/src/app/components/home/LoanPanel.tsx`

**Interfaces:**
- Produces: `getSafeSliderBounds(currentAmount, maximum, requestedMinimum, decimalPlaces): SafeSliderBounds`.
- Produces: finite `start`, `maximum`, `[lower, upper]` padding, and `hasMovableRange`.
- Consumes: BigNumber inputs already computed by the position panels.

- [ ] **Step 1: Write focused tests for valid repayment and withdrawal ranges, collapsed ranges, zero values, negative values, non-finite values, oversized numeric conversion, and a current value above maximum.**

- [ ] **Step 2: Run `node --experimental-strip-types --test apps/web/tests/sliderBounds.test.ts` and confirm failures because the helper does not exist.**

- [ ] **Step 3: Implement the minimal pure bounds helper and wire all returned options into both noUiSlider instances, disabling sliders without movable ranges.**

- [ ] **Step 4: Re-run both focused test files and expect every test to pass.**

- [ ] **Step 5: Run `pnpm checkTs`, `pnpm lint`, and `pnpm build`; expect successful exits with no new warnings attributable to changed files.**

- [ ] **Step 6: Run `git diff --check` and inspect the complete diff against the spec.**

- [ ] **Step 7: Commit with `fix: prevent collapsed position slider crashes`.**
