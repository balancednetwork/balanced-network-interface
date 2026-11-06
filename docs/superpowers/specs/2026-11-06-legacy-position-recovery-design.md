# Legacy position recovery

Restore the existing account's collateral and debt display without depending on the stale ICX price, unauthenticated Hermes HTTP API, or xCallScan block-height service.

## Approach

Keep the normal account-position query. If it fails for an existing borrower, recover confirmed holdings from the Loans contract's paginated borrower lists and verify their debt sum against `getBalanceAndSupply`. Share the result between collateral and debt consumers. A confirmed missing position is distinct from a failed read. Partial fallback results must carry a visible notice: borrower lists cannot discover collateral-only holdings after full repayment.

Read USD oracle prices directly, independently of ICX conversion. Skip failed/invalid prices; use existing backend prices and supported equivalent asset symbols where applicable. Remove the unauthenticated Hermes request. Do not invent a price for an unavailable asset.

Read block heights from the existing chain clients with independent failure handling, rather than xCallScan. Preserve monotonic heights. Do not change transaction construction or contract rules.

## Alternatives and limits

Restoring the ICX oracle and repairing xCallScan/Hermes upstream would restore the old paths, but those services are outside this repository. A new indexer or contract deployment is unnecessary for recovering this active loan and would expand scope. The frontend fallback cannot provide complete collateral-only positions; report this limitation rather than claiming absence or keeping stale amounts silently.

## Verification

Regression tests cover normal/missing/failed position reads, borrower pagination and debt reconciliation, invalid prices, and independent block-height failures. Run relevant TypeScript checks and production build. Exercise the fallback and USD price calls against the reported account using read-only RPC calls. No wallet signing, deployment, or upstream mutation.
