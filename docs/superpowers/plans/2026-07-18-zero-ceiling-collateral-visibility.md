# Zero-Ceiling Collateral Visibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show every Loans contract-registered collateral token and every existing user position even when its debt ceiling is zero.

**Architecture:** Treat `bnJs.Loans.getCollateralTokens()` as the sole source of truth for the existing `useSupportedCollateralTokens()` hook. Removing only the debt-ceiling filtering lets all existing consumers receive registered token addresses without changing panel, modal, slider, or transaction behavior.

**Tech Stack:** TypeScript 5.5, React 18, TanStack React Query 5, pnpm 9, Turborepo 2, Biome 1.8.

## Global Constraints

- Modify application code only in `apps/web/src/store/collateral/hooks.ts`.
- Do not change `apps/web/src/app/components/home/LoanPanel.tsx` or `apps/web/src/app/components/home/CollateralPanel.tsx`.
- Do not add frontend borrowing or depositing restrictions.
- Do not add debt-ceiling eligibility helpers, state, slider changes, action-label changes, transaction guards, or modal changes.
- Preserve the existing BTCB exclusion in `useAllCollateralData()`.
- Keep the existing `useSupportedCollateralTokens()` name, return type, and `['getCollateralTokens']` query key.
- Let the Loans contract gatekeep disabled transactions.

---

### Task 1: Return every registered collateral token

**Files:**
- Modify: `apps/web/src/store/collateral/hooks.ts:386-413`
- Verify unchanged: `apps/web/src/app/components/home/LoanPanel.tsx`
- Verify unchanged: `apps/web/src/app/components/home/CollateralPanel.tsx`

**Interfaces:**
- Consumes: `bnJs.Loans.getCollateralTokens(): Promise<Record<string, string>>`.
- Produces: `useSupportedCollateralTokens(): UseQueryResult<{ [key in string]: string }>` backed by the complete registered collateral map.
- Preserves: React Query key `['getCollateralTokens']` and every existing hook consumer.

- [ ] **Step 1: Run a focused regression assertion and confirm the current implementation fails it**

Run:

```bash
node <<'NODE'
const { readFileSync } = require('node:fs');

const source = readFileSync('apps/web/src/store/collateral/hooks.ts', 'utf8');
const start = source.indexOf('export function useSupportedCollateralTokens');
const end = source.indexOf('export function useDepositedCollateral', start);
const hook = source.slice(start, end);

if (!hook.includes('queryFn: () => bnJs.Loans.getCollateralTokens(),')) {
  throw new Error('useSupportedCollateralTokens must return the registered collateral map directly');
}

if (hook.includes('getDebtCeiling')) {
  throw new Error('useSupportedCollateralTokens must not filter registered tokens by debt ceiling');
}
NODE
```

Expected: exit code 1 with `useSupportedCollateralTokens must return the registered collateral map directly`.

- [ ] **Step 2: Replace the debt-ceiling-filtered query with the registered collateral query**

Replace the complete `useSupportedCollateralTokens()` implementation with:

```ts
export function useSupportedCollateralTokens(): UseQueryResult<{ [key in string]: string }> {
  return useQuery({
    queryKey: ['getCollateralTokens'],
    queryFn: () => bnJs.Loans.getCollateralTokens(),
  });
}
```

Do not change imports: `CallData`, `addresses`, `NETWORK_ID`, and `formatUnits` remain in use elsewhere in `hooks.ts`.

- [ ] **Step 3: Re-run the focused regression assertion and confirm it passes**

Run the exact `node <<'NODE' ... NODE` command from Step 1.

Expected: exit code 0 with no output.

- [ ] **Step 4: Inspect the application-code diff and confirm it contains only the hook simplification**

Run:

```bash
git diff -- apps/web/src/store/collateral/hooks.ts
```

Expected: the debt-ceiling multicall, filter, and BTCB exception are removed; the replacement is the direct `queryFn`; no other function changes.

Run:

```bash
rg -n "getDebtCeiling|debtCeilings|temporarily allow BTCB" apps/web/src/store/collateral/hooks.ts
```

Expected: exit code 1 with no matches. The existing `.filter(symbol => symbol !== 'BTCB')` in `useAllCollateralData()` remains present.

- [ ] **Step 5: Run static verification**

Run:

```bash
pnpm checkTs
```

Expected: all six Turborepo TypeScript tasks succeed.

Run:

```bash
pnpm lint
```

Expected: all lint tasks succeed. The existing unused Biome suppression warning in `SavingsChainSelector/index.tsx` may still be reported; no new warnings may originate from `hooks.ts`.

- [ ] **Step 6: Smoke-test the legacy data flow without submitting transactions**

Run:

```bash
pnpm dev
```

Expected: Vite starts the `web` application and prints its local URL.

At that URL:

1. Open the loans/collateral page without a wallet and confirm “All” contains the Loans contract-registered collateral tokens, with only the pre-existing BTCB exclusion.
2. Connect the known legacy account used during the incident investigation.
3. Confirm “Your collateral” shows its deposited collateral amount and associated bnUSD debt as an actual position, not an `isPotential` wallet-balance entry.
4. Open that position and confirm the existing repay and withdraw controls render normally.
5. Do not submit a borrow, deposit, repay, or withdraw transaction during this smoke test.

- [ ] **Step 7: Prove the panels and adjacent transaction code were not changed**

Run:

```bash
git diff --exit-code c4021c0cc -- \
  apps/web/src/app/components/home/LoanPanel.tsx \
  apps/web/src/app/components/home/CollateralPanel.tsx \
  apps/web/src/app/components/home/_components/xLoanModal/index.tsx \
  apps/web/src/app/components/home/_components/xCollateralModal/index.tsx
```

Expected: exit code 0 with no output.

Run:

```bash
git diff --check
git status --short
```

Expected: `git diff --check` exits 0. Before committing, the only application-code change is `apps/web/src/store/collateral/hooks.ts`; the design and plan documents may also appear if they have not already been committed.

- [ ] **Step 8: Commit the implementation**

```bash
git add apps/web/src/store/collateral/hooks.ts
git commit -m "fix: show zero ceiling collateral positions"
```

Expected: the commit contains only `apps/web/src/store/collateral/hooks.ts`, and the repository's commit-time checks pass.
