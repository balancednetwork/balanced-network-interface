# Zero-debt-ceiling collateral compatibility

## Context

The legacy ICON Loans contract still reports its registered collateral tokens and user positions, but every collateral debt ceiling was set to zero on July 13, 2026. The frontend currently uses a debt-ceiling-filtered token map for both action eligibility and read-only data discovery. Once all ceilings became zero, this coupling emptied the collateral overview and prevented deposited amounts from being stored, even though positions remain on-chain.

## Goal

Keep legacy collateral positions visible and withdrawable after a debt ceiling becomes zero, without allowing users to deposit more collateral or increase debt against a disabled collateral type.

## Data model and hooks

Introduce an unfiltered collateral-token query that returns `Loans.getCollateralTokens()` unchanged. Keep the existing supported-collateral query as the action-eligibility view: it derives its result from the unfiltered map and retains only tokens with a positive debt ceiling.

Read-only consumers use the unfiltered token map:

- aggregate collateral and debt data for the “All collateral” tab;
- per-wallet `getAccountPositions` processing and token decimal lookup;
- oracle-price discovery required to render registered collateral;
- position/debt initialization needed to display and repay existing positions.

Consumers that authorize deposits or increased borrowing continue to use the debt-ceiling-filtered map.

## User interaction rules

For a collateral whose debt ceiling is zero:

- The collateral appears in the “All collateral” tab.
- A signed-in user’s non-zero deposited position appears in “Your collateral.”
- Existing debt remains visible.
- The collateral editor permits the deposited amount to stay unchanged or decrease, but never increase.
- The loan editor permits debt to stay unchanged or decrease, but never increase.
- A wallet balance without an existing deposited position does not expose a Deposit action.
- Transaction handlers defensively reject a deposit or debt increase even if invoked outside the normal button flow.

For a collateral with a positive debt ceiling, current deposit, withdrawal, borrow, and repayment behavior remains unchanged.

## UI behavior

Action availability is derived per selected collateral from the supported-token map. When deposits are disabled, the collateral adjustment maximum is the current deposited amount instead of deposited plus wallet balance. When borrowing is disabled, the maximum editable debt is the current debt. Existing labels and withdrawal/repayment confirmation flows remain unchanged; no new legacy-mode interface or global shutdown flag is introduced.

## Error handling

Read-only queries must not use an address from the filtered map to process a registered token. Token metadata lookup uses the unfiltered address, avoiding the current undefined-address failure for sICX. Action handlers treat a missing entry in the supported-token map as disabled and return before constructing a deposit or borrow transaction.

## Testing

Add focused regression coverage for pure eligibility and range calculations:

- zero-ceiling tokens remain in the registered-token set but not the enabled-token set;
- a disabled collateral can decrease but not increase its deposited amount;
- disabled collateral debt can decrease but not increase;
- enabled collateral retains both directions;
- unfiltered position processing accepts a deposited token even when its ceiling is zero.

Run the focused tests first, followed by the web TypeScript check and production build.

## Out of scope

- Changing ICON contract configuration or restoring debt ceilings.
- Re-enabling new legacy borrowing or deposits.
- Migrating positions to Balanced v2/SODAX.
- Redesigning the collateral or loan panels.
