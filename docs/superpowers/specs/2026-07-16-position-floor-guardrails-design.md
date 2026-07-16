# Position Floor Guardrails Design

## Problem

The collateral and loan sliders are interactive again, but the normalized slider helper returns zero lower padding when a protected minimum consumes the available range. The removed `hasMovableRange` flag previously masked that behavior by disabling the slider. Without the flag, users can drag collateral below the displayed **Locked** threshold or debt below the displayed **Repayable** threshold.

Manual input has the same gap. The active `Deposited` and `Borrowed` fields only enforce a maximum, and the complementary `Wallet` and `Available` fields can indirectly calculate a protected position below the displayed threshold.

## Requirements

- Keep the collateral and loan sliders interactive whenever their panels are in adjusting mode.
- Prevent the collateral slider from moving below the displayed Locked threshold.
- Prevent the loan slider from moving below the displayed Repayable threshold.
- Clamp direct manual input in Deposited and Borrowed to the same normalized minimum.
- Clamp complementary manual input in Wallet and Available so the calculated protected position cannot fall below that minimum.
- Keep `hasMovableRange` removed.
- Preserve the existing debt-ceiling increase restrictions, transaction guards, safety buffers, rounding precision, and contract enforcement.

## Design

### Shared normalized bounds

`getSafeSliderBounds` remains the single source of truth for the slider start, maximum, and protected minimum. Its result will expose the normalized `minimum` used by both noUiSlider and the manual fields.

For a valid requested minimum below the maximum, the helper will round it to the panel precision, cap it at the current position, and return it as both `minimum` and the left slider padding.

When the protected minimum is equal to or above the maximum, the helper will clamp the minimum to the current position instead of returning zero padding. This recreates the historical lock floor without reintroducing a frontend movability flag. If the requested minimum is invalid while the current position and maximum are valid, the helper will fail closed at the current position. Fully invalid slider inputs retain the existing safe numeric fallback.

### Slider behavior

Both panels continue to use `disabled={!isAdjusting}`. Their noUiSlider instances consume `bounds.padding`, so the handle cannot cross the normalized minimum. A collapsed range remains mounted and safe, but its handle cannot move below the current position.

### Manual input behavior

The active fields receive `minValue` from the normalized minimum:

- Collateral `Deposited >= collateral minimum`
- Loan `Borrowed >= loan minimum`

The complementary fields receive a calculated maximum:

- `Wallet <= collateralTotal - collateral minimum`
- `Available <= borrowableAmountWithReserve - loan minimum`

The calculated maxima are floored at zero. `CurrencyField` already clamps values through `minValue` and `maxValue`, so this keeps direct and complementary typing aligned with the slider without adding reducer state or duplicating input handlers.

## Testing

- Prove the normalized helper preserves a valid protected floor.
- Prove a minimum that consumes the range clamps to the current position rather than zero.
- Prove an invalid requested minimum fails closed at the current position when other bounds are valid.
- Prove both sliders remain gated only by `isAdjusting` and consume normalized padding.
- Prove Deposited and Borrowed use the normalized minimum.
- Prove Wallet and Available use complementary maxima derived from that minimum.
- Run the focused eligibility tests, repository TypeScript checks, formatting/lint hooks, and production build.

## Out of Scope

- Reintroducing `hasMovableRange` or hiding/disabling adjustment controls based on debt ceilings.
- Changing contract calls, debt-ceiling rules, locking ratios, repayable calculations, or safety-buffer percentages.
- Redesigning the panels or lock indicators.
