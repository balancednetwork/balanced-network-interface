import BigNumber from 'bignumber.js';

export type CollateralTokenMap = Record<string, string>;

export function selectEnabledCollateralTokens(
  tokens: CollateralTokenMap,
  enabledSymbols: ReadonlySet<string>,
  zeroCeilingExceptions: ReadonlySet<string> = new Set(),
): CollateralTokenMap {
  return Object.fromEntries(
    Object.entries(tokens).filter(([symbol]) => enabledSymbols.has(symbol) || zeroCeilingExceptions.has(symbol)),
  );
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

export function isIncreaseAllowed(currentAmount: BigNumber, nextAmount: BigNumber, increaseEnabled: boolean): boolean {
  return increaseEnabled || nextAmount.isLessThanOrEqualTo(currentAmount);
}
