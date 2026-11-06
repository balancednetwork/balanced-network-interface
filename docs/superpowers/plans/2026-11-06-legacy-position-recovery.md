# Legacy position recovery implementation plan

**Goal:** Recover active legacy positions and remove the broken price and block-height dependencies.

**Architecture:** Shared React Query account reads with a verified borrower-list fallback; direct USD oracle multicalls; existing chain clients for block heights.

**Spec:** `docs/superpowers/specs/2026-11-06-legacy-position-recovery-design.md`

## Constraints and review focus

- Use existing libraries and checkout; keep transaction payloads unchanged.
- Distinguish unknown balances from a confirmed missing position.
- Borrower fallback must preserve exact chain-prefixed owner keys, follow pagination, reconcile debt, and identify incomplete collateral coverage.
- Failed prices must not become zero, NaN, or Infinity.
- One failed chain height must not discard other chains' progress.
- Verify account changes and successful full repayment do not silently preserve old balances.

## Tasks

- [x] Add and run failing node:test regressions for position recovery, price validation, and block-height collection.
- [x] Implement position reader and shared hook; integrate collateral/debt consumers and visible availability notice.
- [x] Replace ICX price conversion and unauthenticated Hermes calls with direct USD oracle reads and validated aliases.
- [x] Replace block-height API polling with chain-client reads and monotonic updates.
- [x] Run regressions, TypeScript/build checks, read-only live verification, and independent review; address findings.

## Verification results

- `pnpm test:legacy`: 18 passing regression tests.
- `pnpm --filter web checkTs` and `pnpm --filter @balancednetwork/xwagmi checkTs`: pass after the build completed. Running the web check concurrently with a package rebuild initially encountered temporary missing declarations; the sequential rerun passed.
- Focused Biome lint and `git diff --check`: pass.
- `pnpm build`: pass; dependency warnings about directives, annotations, and eval remain.
- Read-only verification with both JSON-RPC and the actual BalancedJs SDK recovered 0.071304 BTC collateral and 2601.025194561432245437 bnUSD debt for the reported BNB-chain account. Direct USD multicall reads returned BTC/ETH while skipping the stale ICX feed. ICON and BNB block heights loaded directly.
- Production preview renders and the collateral selector loads USD values. No wallet was connected and no transactions were signed. A Torus wallet version-check fetch error remains unrelated to these paths.
- Independent review found two issues (aggregate errors hiding healthy chains, and conversion errors retaining stale collateral). Both were corrected and re-reviewed with no remaining important findings.
- Changes remain local. No deployment, contract update, or upstream service mutation was performed. Collateral-only recovery still requires an upstream oracle/contract repair.
