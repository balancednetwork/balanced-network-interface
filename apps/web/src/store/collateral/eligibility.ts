import BigNumber from 'bignumber.js';

export type CollateralTokenMap = Record<string, string>;

export function hasPositiveDebtCeiling(ceiling: string | null | undefined): boolean {
  return ceiling != null && new BigNumber(ceiling).isGreaterThan(0);
}

export function selectEnabledCollateralTokens(
  tokens: CollateralTokenMap,
  enabledSymbols: ReadonlySet<string>,
): CollateralTokenMap {
  return Object.fromEntries(Object.entries(tokens).filter(([symbol]) => enabledSymbols.has(symbol)));
}

export function isCollateralEnabled(tokens: CollateralTokenMap | undefined, symbol: string): boolean {
  return Boolean(tokens?.[symbol]);
}

export function getActionMaximum(
  currentAmount: BigNumber,
  availableMaximum: BigNumber,
  increaseEnabled: boolean,
): BigNumber {
  return increaseEnabled ? availableMaximum : currentAmount;
}

export type SafeSliderBounds = {
  padding: [number, number];
  hasMovableRange: boolean;
};

export function getSafeSliderBounds(
  maximum: BigNumber,
  requestedMinimum: BigNumber,
  decimalPlaces: number,
): SafeSliderBounds {
  const roundedMaximum = maximum.dp(decimalPlaces);
  const roundedMinimum = BigNumber.max(requestedMinimum.dp(decimalPlaces), 0);

  if (
    !roundedMaximum.isFinite() ||
    !roundedMinimum.isFinite() ||
    roundedMaximum.isLessThanOrEqualTo(0) ||
    roundedMinimum.isGreaterThanOrEqualTo(roundedMaximum)
  ) {
    return { padding: [0, 0], hasMovableRange: false };
  }

  return {
    padding: [roundedMinimum.toNumber(), 0],
    hasMovableRange: true,
  };
}

export function isIncreaseAllowed(currentAmount: BigNumber, nextAmount: BigNumber, increaseEnabled: boolean): boolean {
  return increaseEnabled || nextAmount.isLessThanOrEqualTo(currentAmount);
}
