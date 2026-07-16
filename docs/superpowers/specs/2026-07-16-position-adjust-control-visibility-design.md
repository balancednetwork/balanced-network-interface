# Position adjustment control visibility

## Context

The legacy collateral and loan panels currently derive `canAdjustCollateral` and `canAdjustLoan` from `getSafeSliderBounds(...).hasMovableRange`. Both panels use those flags to decide whether to render their adjustment controls and whether the adjustment handlers may enter editing mode.

This hides the controls whenever the slider range is collapsed, including valid legacy positions whose deposits or borrowing increases are restricted. Slider movability is a rendering-safety concern and must not determine whether a user can open the position editor.

## Goal

Keep the collateral and loan adjustment controls visible for existing positions and allow users to enter adjustment mode, regardless of whether the slider has a movable range.

## Panel behavior

### Collateral

- Render the adjustment controls whenever a wallet is connected and the selected collateral position has a positive total.
- Let the adjustment handler enter editing mode without checking slider movability.
- Keep the slider disabled when its normalized range is not movable.
- Keep the deposited amount field editable in adjustment mode so the user can enter a value directly.

### Loan

- Render the adjustment controls for the connected account whenever the loan panel is displaying an existing position.
- Let the adjustment handler enter editing mode without checking slider movability.
- Keep the slider disabled when its normalized range is not movable.
- Keep the borrowed amount field editable in adjustment mode so the user can enter a value directly.

## Restrictions and safety

This change only decouples control visibility and editor entry from slider movability. It does not change:

- normalized noUiSlider bounds;
- debt-ceiling eligibility calculations;
- action maximums;
- confirmation guards for disabled collateral deposits or debt increases;
- transaction-handler guards;
- contract enforcement of collateral, debt, and balance requirements.

The frontend continues to fail closed for explicitly disabled increases. Contracts remain authoritative for all other position constraints.

## Testing

Add focused regression assertions that:

- neither panel gates its adjustment controls on `hasMovableRange`;
- neither adjustment handler returns early because its slider range is collapsed;
- both sliders continue to use `hasMovableRange` only for their disabled state;
- the existing increase and transaction guards remain present.

Run the focused collateral eligibility regression suite followed by the workspace TypeScript check and production build.

## Out of scope

- Re-enabling deposits or borrowing for zero-ceiling collateral.
- Changing contract configuration or transaction behavior.
- Redesigning either panel or adding new warning messages.
