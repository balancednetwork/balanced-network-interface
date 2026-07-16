# Exit slider interaction

## Context

The zero-ceiling slider hardening added `SafeSliderBounds.hasMovableRange` and used it to disable both the collateral and loan sliders. A collapsed frontend-derived range therefore prevents all slider interaction, even though `getSafeSliderBounds()` already returns safe zero padding for that state and the contracts remain authoritative for withdrawals and repayments.

Before this hardening, both sliders were disabled only when their panel was not in adjustment mode. Their protected padding calculations are older behavior and must remain intact.

## Goal

Restore slider interaction for collateral withdrawals and loan repayments without removing long-standing padding behavior or weakening numeric noUiSlider safety.

## Behavior

- The collateral slider is disabled only when `isAdjusting` is false.
- The loan slider is disabled only when `isAdjusting` is false.
- Both sliders continue to consume normalized `start`, `maximum`, and `padding` values from `getSafeSliderBounds()`.
- A collapsed protected range continues to receive zero padding, making the normalized slider interactive instead of disabling it.
- Zero-ceiling positions retain `maximum = current position`, so the slider can decrease the position but cannot increase it.
- Existing deposit and borrowing confirmation and transaction guards remain unchanged.
- Contracts continue to enforce withdrawal, repayment, collateralization, and balance requirements.

## Helper cleanup

Remove `hasMovableRange` from `SafeSliderBounds` and from every return value of `getSafeSliderBounds()`. It has no remaining production consumer after the panel fix, and keeping it available risks reintroducing frontend exit gating.

Keep the helper's current inputs and its numeric normalization behavior unchanged:

- valid ranges preserve the requested protected padding;
- collapsed protected ranges use `[0, 0]` padding;
- invalid or non-finite ranges use the safe fallback start, maximum, and padding.

## Testing

Update the focused eligibility tests to assert only `start`, `maximum`, and `padding`. Add source-level regression assertions that:

- neither production panel references `hasMovableRange`;
- both noUiSlider instances use `disabled={!isAdjusting}`;
- both panels continue to consume normalized start, maximum, and padding;
- disabled-increase confirmation and transaction guards remain present.

Run the focused regression suite, workspace TypeScript checks, production build, and an interactive browser check of both adjustment panels.

## Out of scope

- Removing or changing the long-standing collateral lock padding.
- Removing or changing the long-standing loan repayment padding.
- Changing debt-ceiling eligibility or contract calls.
- Redesigning the lock and repayable indicators.
