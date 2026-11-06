import BigNumber from 'bignumber.js';

export function parseUsdPrices(symbols: string[], values: (string | null)[]): Record<string, BigNumber> {
  const prices: Record<string, BigNumber> = {};
  symbols.forEach((symbol, index) => {
    const raw = values[index];
    if (raw == null || raw === '') return;
    const price = new BigNumber(raw).shiftedBy(-18);
    if (price.isFinite() && price.isGreaterThan(0)) prices[symbol] = price;
  });
  return prices;
}
