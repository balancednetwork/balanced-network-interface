# Collateral Dropdown Sorting and ICX Crash Design

## Context

The collateral dropdown now displays token-denominated collateral amounts in its All tab, but its sorting logic still converts collateral through oracle prices. A token without an oracle entry, such as afSUI, compares as equal to every other row and therefore remains pinned in its original position. The dropdown also defaults to collateral sorting even though loan balances are the most useful initial ordering.

Selecting ICX while signed in mounts the position panels. Some legacy positions produce a slider whose protected minimum consumes its full range. noUiSlider rejects that configuration during render, leaving the page white.

## Behavior

- The dropdown defaults to Loan descending, so the largest bnUSD loan appears first.
- In the All tab, Collateral sorting uses the raw token amount shown in the column rather than an oracle-denominated value.
- In the Your tab, Collateral sorting keeps using the displayed oracle-denominated value; a missing oracle price is treated as zero rather than making the comparator return equality for unrelated rows.
- Name and loan sorting remain available in both directions.
- Collapsed, zero, non-finite, or otherwise invalid collateral and loan slider inputs are normalized to valid noUiSlider options.
- A slider with no movable range is rendered disabled, while valid withdrawal and repayment ranges remain usable.

## Implementation

Extract the dropdown comparison logic into a pure TypeScript module. The React hook owns only sort state and delegates ordering to that module. Export one default sort constant so the hook and tests share the Loan-descending decision.

Add a pure slider-bounds helper that receives the current value, maximum value, protected minimum, and decimal precision. It returns finite `start`, `maximum`, and `padding` values plus whether the range can move. Both position panels consume every returned option instead of constructing partial bounds independently.

## Testing

- Verify the default sort is Loan descending.
- Verify All-tab collateral sorting changes direction using raw token amounts even when prices are missing.
- Verify loan sorting places the highest balance first.
- Verify missing Your-tab prices sort as zero instead of pinning a row.
- Verify valid repayment and withdrawal ranges remain movable.
- Verify collapsed, zero, non-finite, and out-of-range slider inputs produce safe disabled options.
- Run the focused Node tests, TypeScript checks, lint, and the production build.

## Out of Scope

- Changing oracle feeds or adding an afSUI oracle price.
- Changing displayed values in the Your tab.
- Changing collateral eligibility, debt ceilings, or transaction permissions.
- Redesigning the position panels or dropdown.
