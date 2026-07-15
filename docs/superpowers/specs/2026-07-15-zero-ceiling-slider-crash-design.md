# Zero-ceiling position slider crash hotfix

## Problem

The zero-debt-ceiling workaround caps deposit and borrow controls at the user's current position so that existing positions remain visible and can only decrease. noUiSlider also receives a lower padding value that represents the portion of the position that cannot currently be withdrawn or repaid.

For some users, that protected minimum is equal to or greater than the capped range maximum. noUiSlider requires total padding to be strictly smaller than its range and throws during React render when that invariant is violated, producing a white screen.

The supplied Avalanche account demonstrates the failure: its current debt is about 605.31 bnUSD, its available bnUSD(old) balance is 0.09, and the protected debt minimum (including the existing 0.1 reserve) is about 605.32. The zero-ceiling maximum is 605.31, so the slider is initialized with padding greater than its range.

## Requirements

- A zero-ceiling position must never crash the application, including when its protected minimum is equal to or greater than its current amount.
- Existing debt must remain repayable whenever the selected repayment network has a positive repayable amount.
- Existing collateral must remain withdrawable whenever the position has unlocked collateral.
- Depositing more collateral and increasing debt must remain unavailable while the debt ceiling is zero.
- A position with no currently movable amount must render safely and must not expose an invalid adjustment.
- Positive-ceiling collateral behavior must remain unchanged.

## Design

Add a small, pure slider-bounds helper alongside the collateral eligibility helpers. It will accept the real action maximum and the requested lower padding, then return:

- a noUiSlider-safe padding value that is always non-negative and strictly smaller than the range maximum; and
- whether the range contains a meaningful decreasing movement.

The collateral and loan panels will use the helper when constructing their sliders. If the requested padding consumes the entire capped range, the component will render the slider without invalid padding and keep adjustment disabled. If the padding is below the maximum, the original protected minimum remains in effect and the user can move the handle downward to withdraw or repay.

The real action maximum remains unchanged. Transaction-level guards will continue rejecting deposits and borrowing for zero-ceiling assets. The helper only makes the visualization valid; it does not expand the permitted position.

## Data flow

1. Existing hooks calculate the current deposit or debt, available action maximum, locked collateral, and protected debt amount.
2. The panel passes the maximum and protected amount to the slider-bounds helper.
3. The helper classifies the range as movable or collapsed and returns valid noUiSlider padding.
4. The panel enables adjustment only when an increase is allowed or the existing position has a decreasing movement.
5. Confirmation and transaction handlers continue enforcing the zero-ceiling increase prohibition.

## Error handling

Non-finite, zero, or negative maxima and padding values are treated as collapsed rather than passed to noUiSlider. This fails closed: the page remains usable, but an invalid adjustment is not enabled.

## Testing

Focused regression tests will cover:

- the reported debt case where padding is greater than the maximum;
- padding exactly equal to the maximum;
- a valid partial repayment range;
- a valid unlocked-collateral withdrawal range;
- positive-ceiling behavior; and
- source wiring showing that both home sliders consume the normalized bounds while the existing increase guards remain present.

Verification will include the focused test suite, workspace TypeScript checks, a production build, and a browser smoke test of the affected home-page controls.
