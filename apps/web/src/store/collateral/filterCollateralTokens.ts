export function filterCollateralTokensByDebtLimit(
  collateralTokens: Record<string, string>,
  debtLimits: number[],
): Record<string, string> {
  return Object.keys(collateralTokens).reduce(
    (supportedTokens, symbol, index) => {
      if (debtLimits[index] === 0) {
        supportedTokens[symbol] = collateralTokens[symbol];
      }

      return supportedTokens;
    },
    {} as Record<string, string>,
  );
}
