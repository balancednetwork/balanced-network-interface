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

export function isIncreaseAllowed(currentAmount: BigNumber, nextAmount: BigNumber, increaseEnabled: boolean): boolean {
  return increaseEnabled || nextAmount.isLessThanOrEqualTo(currentAmount);
}
