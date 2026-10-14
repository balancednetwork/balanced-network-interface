# Zero-Ceiling Collateral Visibility Design

## Problem

The legacy Loans contract still returns registered collateral tokens and account positions after ICON governance set every legacy collateral debt ceiling to zero. The frontend currently removes zero-ceiling collateral from `useSupportedCollateralTokens()`. That makes the “All” collateral list empty and prevents `useCollateralFetchInfo()` from resolving and storing deposited amounts, so “Your collateral” can show wallet-balance fallback entries instead of the user's on-chain position.

## Goal

Keep every token returned by `bnJs.Loans.getCollateralTokens()` visible and usable throughout the existing legacy UI data flow, regardless of debt ceiling, so users can see their collateral, debt, and existing positions and continue using the familiar repay and withdraw flows.

## Non-Goals

- Do not add frontend borrowing or depositing restrictions.
- Do not add debt-ceiling eligibility helpers or state.
- Do not change slider behavior, action labels, transaction handlers, or confirmation modals.
- Do not change `LoanPanel.tsx` or `CollateralPanel.tsx`.
- Do not alter the existing BTCB exclusion in the “All” list.
- Do not add unrelated migration or withdrawal-only UI.

## Design

Treat the Loans contract's registered collateral map as the frontend's source of truth. Simplify `useSupportedCollateralTokens()` so its React Query function returns `bnJs.Loans.getCollateralTokens()` directly. Remove the debt-ceiling multicall, zero-ceiling filter, and hard-coded BTCB exception from that hook.

Keep the existing hook name and query key to minimize churn. Existing consumers will automatically receive the complete registered-token map:

- `useTotalCollateralData()` will query totals for every registered collateral, allowing `useAllCollateralData()` to populate “All” while retaining its existing BTCB exclusion.
- `useCollateralFetchInfo()` will recognize every holding returned by `getAccountPositions()` and resolve its token address before reading decimals, including sICX.
- `useUserPositionsData()` will receive the stored deposited amounts and prefer real positions over wallet-balance fallback entries.
- Existing panel and modal behavior will remain unchanged. If a user attempts an action that governance has disabled, the contract remains responsible for rejecting it.

## Error Handling

No new error path is introduced. React Query will continue to expose failures from `getCollateralTokens()`, and the existing account-position fetch handling remains unchanged. Removing the debt-ceiling multicall also removes one network request and its associated failure mode.

## Files

- Modify `apps/web/src/store/collateral/hooks.ts` only.
- Do not modify `apps/web/src/app/components/home/LoanPanel.tsx`.
- Do not modify `apps/web/src/app/components/home/CollateralPanel.tsx`.

## Verification

1. Confirm `useSupportedCollateralTokens()` returns the complete `getCollateralTokens()` result without calling `getDebtCeiling`.
2. Run the repository TypeScript checks.
3. Run the repository lint checks and distinguish pre-existing warnings from new failures.
4. Start the legacy web app and confirm “All” shows the registered collateral set, subject only to the existing BTCB exclusion.
5. Connect a known legacy account and confirm “Your collateral” displays its deposited collateral and bnUSD debt rather than a potential wallet-balance position.
6. Confirm the two panel files and transaction/modal code are unchanged.

## Success Criteria

- Zero-ceiling collateral tokens remain present in the legacy collateral data flow.
- A known legacy account's on-chain deposited collateral and debt are visible.
- Existing repay and withdraw controls remain available through the unchanged UI.
- No client-side action restrictions or other product behavior are added.
