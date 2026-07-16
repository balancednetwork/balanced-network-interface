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
  start: number;
  minimum: number;
  maximum: number;
  padding: [number, number];
};

const FALLBACK_SLIDER_MAXIMUM = 0.001;

export function getSafeSliderBounds(
  currentAmount: BigNumber,
  maximum: BigNumber,
  requestedMinimum: BigNumber,
  decimalPlaces: number,
): SafeSliderBounds {
  const roundedCurrentAmount = currentAmount.dp(decimalPlaces);
  const roundedMaximum = maximum.dp(decimalPlaces);
  const roundedRequestedMinimum = requestedMinimum.dp(decimalPlaces);
  const start = roundedCurrentAmount.toNumber();
  const numericMaximum = roundedMaximum.toNumber();

  if (
    !roundedCurrentAmount.isFinite() ||
    !roundedMaximum.isFinite() ||
    !Number.isFinite(start) ||
    !Number.isFinite(numericMaximum) ||
    roundedCurrentAmount.isNegative() ||
    roundedMaximum.isLessThanOrEqualTo(0) ||
    start > numericMaximum
  ) {
    return {
      start: 0,
      minimum: 0,
      maximum: FALLBACK_SLIDER_MAXIMUM,
      padding: [0, 0],
    };
  }

  const minimum =
    roundedRequestedMinimum.isFinite() && !roundedRequestedMinimum.isNegative()
      ? BigNumber.min(roundedRequestedMinimum, roundedCurrentAmount).toNumber()
      : start;
  const safeMinimum = Number.isFinite(minimum) ? minimum : start;

  return {
    start,
    minimum: safeMinimum,
    maximum: numericMaximum,
    padding: [safeMinimum, 0],
  };
}

export function isIncreaseAllowed(currentAmount: BigNumber, nextAmount: BigNumber, increaseEnabled: boolean): boolean {
  return increaseEnabled || nextAmount.isLessThanOrEqualTo(currentAmount);
}
