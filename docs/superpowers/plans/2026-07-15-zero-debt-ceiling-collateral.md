# Zero-debt-ceiling Collateral Compatibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore discovery and withdrawal/repayment of legacy collateral positions while preventing deposits and debt increases for collateral with a zero debt ceiling.

**Architecture:** Split the Loans contract's registered token map from the debt-ceiling-filtered action-eligibility map. Read paths consume the registered map; collateral and loan panels use small pure eligibility helpers to cap edits and guard transaction dispatch for disabled assets.

**Tech Stack:** React 18, TypeScript 5.5, Redux Toolkit, TanStack Query 5, BigNumber.js, Node.js 22 built-in test runner, Vite 5.

## Global Constraints

- Zero-ceiling collateral must remain visible and withdrawable/repayable.
- Zero-ceiling collateral must not accept new deposits or debt increases.
- Positive-ceiling collateral must retain its current behavior.
- Do not change ICON contract state or add a global legacy-shutdown flag.
- Do not add a test-framework dependency; use the Node.js 22 built-in test runner with type stripping.

---

## File map

- Create `apps/web/src/store/collateral/eligibility.ts`: pure token selection and amount-direction rules shared by collateral and loan UI.
- Create `apps/web/tests/collateralEligibility.test.ts`: regression tests runnable with `node --test`.
- Modify `apps/web/src/store/collateral/hooks.ts`: expose registered tokens separately, derive enabled tokens, and use registered tokens for position reads.
- Modify `apps/web/src/store/loan/hooks.ts`: initialize existing debt and ratios from registered tokens.
- Modify `apps/web/src/store/oracle/hooks.ts`: load prices for every registered collateral.
- Modify `apps/web/src/store/savings/hooks.ts`: remove the unused filtered-token import.
- Modify `apps/web/src/app/components/home/CollateralPanel.tsx`: allow withdrawals but guard deposits for disabled collateral.
- Modify `apps/web/src/app/components/home/LoanPanel.tsx`: allow repayments but guard borrowing for disabled collateral.
- Modify `apps/web/src/app/components/home/_components/xCollateralModal/index.tsx`: add a cross-chain deposit dispatch guard.
- Modify `apps/web/src/app/components/home/_components/xLoanModal/index.tsx`: add a cross-chain borrow dispatch guard.

### Task 1: Add tested collateral eligibility primitives

**Files:**
- Create: `apps/web/tests/collateralEligibility.test.ts`
- Create: `apps/web/src/store/collateral/eligibility.ts`

**Interfaces:**
- Produces: `CollateralTokenMap = Record<string, string>`
- Produces: `selectEnabledCollateralTokens(tokens, enabledSymbols, zeroCeilingExceptions?): CollateralTokenMap`
- Produces: `isCollateralEnabled(tokens, symbol): boolean`
- Produces: `getActionMaximum(currentAmount, availableMaximum, increaseEnabled): BigNumber`
- Produces: `isIncreaseAllowed(currentAmount, nextAmount, increaseEnabled): boolean`

- [ ] **Step 1: Write the failing regression tests**

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import BigNumber from 'bignumber.js';

import {
  getActionMaximum,
  isCollateralEnabled,
  isIncreaseAllowed,
  selectEnabledCollateralTokens,
} from '../src/store/collateral/eligibility.ts';

const tokens = { sICX: 'cx-sicx', ETH: 'cx-eth', BTCB: 'cx-btcb' };

test('keeps registered tokens separate from debt-ceiling-enabled tokens', () => {
  const enabled = selectEnabledCollateralTokens(tokens, new Set<string>(), new Set(['BTCB']));

  assert.deepEqual(tokens, { sICX: 'cx-sicx', ETH: 'cx-eth', BTCB: 'cx-btcb' });
  assert.deepEqual(enabled, { BTCB: 'cx-btcb' });
  assert.equal(isCollateralEnabled(enabled, 'sICX'), false);
});

test('disabled collateral can decrease but not increase its deposited amount or debt', () => {
  const current = new BigNumber(10);

  assert.equal(isIncreaseAllowed(current, new BigNumber(5), false), true);
  assert.equal(isIncreaseAllowed(current, new BigNumber(10), false), true);
  assert.equal(isIncreaseAllowed(current, new BigNumber(11), false), false);
  assert.equal(getActionMaximum(current, new BigNumber(25), false).toFixed(), '10');
});

test('enabled collateral retains increases and the full available maximum', () => {
  const current = new BigNumber(10);
  const maximum = new BigNumber(25);

  assert.equal(isIncreaseAllowed(current, new BigNumber(11), true), true);
  assert.equal(getActionMaximum(current, maximum, true).toFixed(), '25');
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `node --test apps/web/tests/collateralEligibility.test.ts`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/store/collateral/eligibility.ts`.

- [ ] **Step 3: Implement the minimal pure helpers**

```ts
import BigNumber from 'bignumber.js';

export type CollateralTokenMap = Record<string, string>;

export function selectEnabledCollateralTokens(
  tokens: CollateralTokenMap,
  enabledSymbols: ReadonlySet<string>,
  zeroCeilingExceptions: ReadonlySet<string> = new Set(),
): CollateralTokenMap {
  return Object.fromEntries(
    Object.entries(tokens).filter(([symbol]) => enabledSymbols.has(symbol) || zeroCeilingExceptions.has(symbol)),
  );
}

export function isCollateralEnabled(tokens: CollateralTokenMap | undefined, symbol: string): boolean {
  return Boolean(tokens?.[symbol]);
}

export function getActionMaximum(
  currentAmount: BigNumber,
  availableMaximum: BigNumber,
  increaseEnabled: boolean,
): BigNumber {
  return increaseEnabled ? availableMaximum : currentAmount;
}

export function isIncreaseAllowed(
  currentAmount: BigNumber,
  nextAmount: BigNumber,
  increaseEnabled: boolean,
): boolean {
  return increaseEnabled || nextAmount.isLessThanOrEqualTo(currentAmount);
}
```

- [ ] **Step 4: Run the tests and verify GREEN**

Run: `node --test apps/web/tests/collateralEligibility.test.ts`

Expected: 3 tests pass, 0 fail.

- [ ] **Step 5: Commit the primitives**

```bash
git add apps/web/src/store/collateral/eligibility.ts apps/web/tests/collateralEligibility.test.ts
git commit -m "test: cover zero ceiling collateral eligibility"
```

### Task 2: Separate registered collateral reads from enabled collateral actions

**Files:**
- Modify: `apps/web/src/store/collateral/hooks.ts:89-220,386-413,565-666`
- Modify: `apps/web/src/store/loan/hooks.ts:18-110`
- Modify: `apps/web/src/store/oracle/hooks.ts:8-38`
- Modify: `apps/web/src/store/savings/hooks.ts:1-20`

**Interfaces:**
- Consumes: `selectEnabledCollateralTokens()` from Task 1.
- Produces: `useCollateralTokens(): UseQueryResult<CollateralTokenMap>` for every registered token.
- Preserves: `useSupportedCollateralTokens(): UseQueryResult<CollateralTokenMap>` as the positive-ceiling action map.

- [ ] **Step 1: Add a source-level wiring assertion to the regression test**

Append to `apps/web/tests/collateralEligibility.test.ts`:

```ts
import { readFile } from 'node:fs/promises';

test('position reads use registered collateral tokens', async () => {
  const hooks = await readFile(new URL('../src/store/collateral/hooks.ts', import.meta.url), 'utf8');
  const totalDataHook = hooks.slice(
    hooks.indexOf('export function useTotalCollateralData'),
    hooks.indexOf('export function useCollateralFetchInfo'),
  );
  const fetchInfoHook = hooks.slice(
    hooks.indexOf('export function useCollateralFetchInfo'),
    hooks.indexOf('export function useCollateralState'),
  );

  assert.match(totalDataHook, /useCollateralTokens\(\)/);
  assert.match(fetchInfoHook, /useCollateralTokens\(\)/);
  assert.doesNotMatch(fetchInfoHook, /supportedCollateralTokens\[symbol\]/);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test --test-name-pattern="position reads" apps/web/tests/collateralEligibility.test.ts`

Expected: FAIL because both read hooks still call `useSupportedCollateralTokens()`.

- [ ] **Step 3: Split the registered and enabled queries**

In `apps/web/src/store/collateral/hooks.ts`, import `selectEnabledCollateralTokens` and replace the current query with:

```ts
export function useCollateralTokens(): UseQueryResult<Record<string, string>> {
  return useQuery({
    queryKey: ['getCollateralTokens'],
    queryFn: () => bnJs.Loans.getCollateralTokens(),
  });
}

export function useSupportedCollateralTokens(): UseQueryResult<Record<string, string>> {
  const { data: collateralTokens } = useCollateralTokens();

  return useQuery({
    queryKey: ['getSupportedCollateralTokens', collateralTokens],
    queryFn: async () => {
      if (!collateralTokens) return {};

      const cds: CallData[] = Object.keys(collateralTokens).map(symbol => ({
        target: addresses[NETWORK_ID].loans,
        method: 'getDebtCeiling',
        params: [symbol],
      }));
      const debtCeilingsData = await bnJs.Multicall.getAggregateData(cds);
      const enabledSymbols = new Set(
        Object.keys(collateralTokens).filter((symbol, index) => {
          const ceiling = debtCeilingsData[index];
          return ceiling === null || parseInt(formatUnits(ceiling)) > 0;
        }),
      );

      return selectEnabledCollateralTokens(collateralTokens, enabledSymbols, new Set(['BTCB']));
    },
    enabled: Boolean(collateralTokens),
  });
}
```

- [ ] **Step 4: Move every read-only consumer to registered tokens**

Apply these exact data-flow changes:

```ts
// collateral/hooks.ts
const { data: collateralTokens } = useCollateralTokens(); // useTotalCollateralData
const { data: collateralTokens } = useCollateralTokens(); // useCollateralFetchInfo

const isRegistered = React.useCallback(
  (symbol: string) => Boolean(collateralTokens?.[symbol]),
  [collateralTokens],
);

// Inside getAccountPositions processing:
if (isRegistered(symbol)) {
  const tokenAddress = collateralTokens?.[symbol];
  if (!tokenAddress) return;
  const decimals: string = await bnJs.getContract(tokenAddress).decimals();
  // preserve existing depositedAmount conversion and dispatch
}
```

Also:

- Use `collateralTokens` in `useTotalCollateralData` and its query key.
- Include `xDepositedAmounts` in the `useUserPositionsData` query key so fetched deposits update the list immediately.
- In `loan/hooks.ts`, replace `useSupportedCollateralTokens()` with `useCollateralTokens()` in `useLoanFetchInfo`; use all registered symbols for debt reset and locking-ratio reads.
- In `oracle/hooks.ts`, replace `useSupportedCollateralTokens()` with `useCollateralTokens()` so every listed token has a price request.
- Remove the unused `useSupportedCollateralTokens` import from `savings/hooks.ts`.

- [ ] **Step 5: Run focused tests and TypeScript verification**

Run: `node --test apps/web/tests/collateralEligibility.test.ts && pnpm --filter web checkTs`

Expected: 4 tests pass, then TypeScript exits 0.

- [ ] **Step 6: Commit the read-path separation**

```bash
git add apps/web/src/store/collateral/hooks.ts apps/web/src/store/loan/hooks.ts apps/web/src/store/oracle/hooks.ts apps/web/src/store/savings/hooks.ts apps/web/tests/collateralEligibility.test.ts
git commit -m "fix: read legacy zero ceiling collateral positions"
```

### Task 3: Restrict disabled collateral to withdrawals and repayments

**Files:**
- Modify: `apps/web/src/app/components/home/CollateralPanel.tsx:128-340,355-620`
- Modify: `apps/web/src/app/components/home/LoanPanel.tsx:40-420`
- Modify: `apps/web/src/app/components/home/_components/xCollateralModal/index.tsx:30-130`
- Modify: `apps/web/src/app/components/home/_components/xLoanModal/index.tsx:30-145`
- Modify: `apps/web/tests/collateralEligibility.test.ts`

**Interfaces:**
- Consumes: `isCollateralEnabled()`, `getActionMaximum()`, and `isIncreaseAllowed()` from Task 1.
- Adds: `increaseEnabled: boolean` to both cross-chain modal props.

- [ ] **Step 1: Add source-level tests for defensive transaction guards**

Append to `apps/web/tests/collateralEligibility.test.ts`:

```ts
test('collateral and loan transaction handlers guard disabled increases', async () => {
  const collateralPanel = await readFile(
    new URL('../src/app/components/home/CollateralPanel.tsx', import.meta.url),
    'utf8',
  );
  const loanPanel = await readFile(new URL('../src/app/components/home/LoanPanel.tsx', import.meta.url), 'utf8');
  const xCollateralModal = await readFile(
    new URL('../src/app/components/home/_components/xCollateralModal/index.tsx', import.meta.url),
    'utf8',
  );
  const xLoanModal = await readFile(
    new URL('../src/app/components/home/_components/xLoanModal/index.tsx', import.meta.url),
    'utf8',
  );

  assert.match(collateralPanel, /if \(shouldDeposit && !increaseEnabled\) return/);
  assert.match(loanPanel, /if \(shouldBorrow && !increaseEnabled\) return/);
  assert.match(xCollateralModal, /if \(storedModalValues\.action === XCollateralAction\.DEPOSIT && !increaseEnabled\) return/);
  assert.match(xLoanModal, /if \(storedModalValues\.action === XLoanAction\.BORROW && !increaseEnabled\) return/);
});
```

- [ ] **Step 2: Run the guard test and verify RED**

Run: `node --test --test-name-pattern="transaction handlers" apps/web/tests/collateralEligibility.test.ts`

Expected: FAIL because the four guards are absent.

- [ ] **Step 3: Restrict collateral editing and dispatch**

In `CollateralPanel.tsx`:

```ts
const { data: collateralTokens } = useCollateralTokens();
const { data: supportedCollateralTokens } = useSupportedCollateralTokens();
const contractSymbol = useWrongSymbol(collateralType);
const increaseEnabled = isCollateralEnabled(supportedCollateralTokens, contractSymbol);
const actionMaximum = getActionMaximum(collateralDeposit, collateralTotal, increaseEnabled);
const canAdjustCollateral = increaseEnabled || collateralDeposit.isGreaterThan(0);

const toggleOpen = () => {
  if (!isIncreaseAllowed(collateralDeposit, parsedAmount[Field.LEFT], increaseEnabled)) return;
  // preserve existing modal-opening body
};

const handleCollateralConfirm = async () => {
  if (shouldDeposit && !increaseEnabled) return;
  const collateralTokenAddress = collateralTokens?.[contractSymbol];
  if (!collateralTokenAddress) return;
  // preserve the current transaction body
};
```

Then apply these UI constraints:

- Show the action controls only when `canAdjustCollateral` is true.
- Use `actionMaximum` as the collateral slider maximum and deposited-field `maxValue`.
- Make the wallet-side field editable only when `increaseEnabled` is true.
- Pass `increaseEnabled={increaseEnabled}` to `XCollateralModal`.
- Disable the local modal confirmation when `shouldDeposit && !increaseEnabled` as an additional UI safeguard.

- [ ] **Step 4: Restrict loan editing and dispatch**

In `LoanPanel.tsx`:

```ts
const { data: supportedCollateralTokens } = useSupportedCollateralTokens();
const increaseEnabled = isCollateralEnabled(supportedCollateralTokens, useWrongSymbol(collateralType));
const actionMaximum = getActionMaximum(borrowedAmount, borrowableAmountWithReserve, increaseEnabled);
const canAdjustLoan = increaseEnabled || borrowedAmount.isGreaterThan(0);

const toggleOpen = () => {
  if (!isIncreaseAllowed(borrowedAmount, parsedAmount[Field.LEFT], increaseEnabled)) return;
  // preserve existing modal-opening body
};

const handleLoanConfirm = () => {
  if (shouldBorrow && !increaseEnabled) return;
  // preserve existing transaction body
};
```

Then apply these UI constraints:

- Show the action controls only when `canAdjustLoan` is true.
- Use `actionMaximum` as the loan slider maximum and borrowed-field `maxValue`.
- Make the available-side field editable only when `increaseEnabled` is true.
- Pass `increaseEnabled={increaseEnabled}` to `XLoanModal`.
- Disable the local modal confirmation when `shouldBorrow && !increaseEnabled`.

- [ ] **Step 5: Add cross-chain modal guards**

Add `increaseEnabled: boolean` to each modal props type and destructuring. Before constructing or sending a transaction, add:

```ts
// xCollateralModal
if (storedModalValues.action === XCollateralAction.DEPOSIT && !increaseEnabled) return;

// xLoanModal
if (storedModalValues.action === XLoanAction.BORROW && !increaseEnabled) return;
```

Disable the corresponding confirmation button when the stored action is an increase and `increaseEnabled` is false.

- [ ] **Step 6: Run focused regression tests and TypeScript**

Run: `node --test apps/web/tests/collateralEligibility.test.ts && pnpm --filter web checkTs`

Expected: 5 tests pass, then TypeScript exits 0.

- [ ] **Step 7: Commit the action restrictions**

```bash
git add apps/web/src/app/components/home/CollateralPanel.tsx apps/web/src/app/components/home/LoanPanel.tsx apps/web/src/app/components/home/_components/xCollateralModal/index.tsx apps/web/src/app/components/home/_components/xLoanModal/index.tsx apps/web/tests/collateralEligibility.test.ts
git commit -m "fix: restrict zero ceiling collateral to exits"
```

### Task 4: Verify the complete workaround

**Files:**
- Verify only; no planned source changes.

**Interfaces:**
- Consumes the completed behavior from Tasks 1-3.
- Produces fresh test, type-check, build, and diff evidence.

- [ ] **Step 1: Run all focused tests**

Run: `node --test apps/web/tests/collateralEligibility.test.ts`

Expected: 5 tests pass, 0 fail.

- [ ] **Step 2: Run the repository TypeScript checks**

Run: `pnpm checkTs`

Expected: all six workspace tasks succeed.

- [ ] **Step 3: Run the production web build**

Run: `pnpm --filter web build`

Expected: Vite exits 0 and produces the web distribution bundle.

- [ ] **Step 4: Inspect the final change set**

Run: `git status --short && git diff --check && git log -4 --oneline`

Expected: no unstaged runtime changes, no whitespace errors, and the design, plan, and three implementation commits are visible.

- [ ] **Step 5: Report verification evidence**

Summarize the registered/enabled split, withdrawal/repayment-only UI behavior, defensive transaction guards, exact test count, TypeScript result, and build result. Do not claim browser verification unless it was actually performed with a signed-in wallet containing a legacy position.
