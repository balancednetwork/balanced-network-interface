import BigNumber from 'bignumber.js';

export type ContractRead = (method: string, params?: Record<string, string>) => Promise<any>;
export type LegacyPositions = {
  holdings: Record<string, Record<string, string>>;
  source: 'positions' | 'borrowers';
};

export function isCollateralKnown(position: LegacyPositions | undefined, symbol: string): boolean {
  return position?.source !== 'borrowers' || Object.hasOwn(position.holdings, symbol);
}

export function summarizePositionReads<T extends LegacyPositions, C extends string>(
  results: { data?: T; isError: boolean; isPending: boolean }[],
  chainIds: C[],
) {
  return {
    data: results.flatMap(result => (result.data && !result.isError ? [result.data] : [])),
    unavailableChains: chainIds.filter((_, index) => results[index].isError),
    pendingChains: chainIds.filter((_, index) => results[index].isPending),
    isFallback: results.some(result => !result.isError && result.data?.source === 'borrowers'),
  };
}

export function normalizePositionHoldings(
  holdings: LegacyPositions['holdings'],
  decimals: Record<string, number>,
): Record<string, { collateral: string; loan: string }> {
  return Object.fromEntries(
    Object.entries(holdings).map(([symbol, holding]) => {
      const precision = decimals[symbol];
      if (!Number.isInteger(precision) || precision < 0 || precision > 255)
        throw new Error(`Invalid decimals for ${symbol}`);
      const collateral = new BigNumber(holding[symbol]);
      const loan = new BigNumber(holding.bnUSD);
      if (!collateral.isFinite() || collateral.isNegative() || !loan.isFinite() || loan.isNegative()) {
        throw new Error(`Invalid position balance for ${symbol}`);
      }
      return [symbol, { collateral: collateral.shiftedBy(-precision).toFixed(), loan: loan.shiftedBy(-18).toFixed() }];
    }),
  );
}

export async function readLegacyPositions(
  read: ContractRead,
  owner: string,
  collateralTokens: Record<string, string>,
): Promise<LegacyPositions> {
  try {
    const position = await read('getAccountPositions', { _owner: owner });
    if (!position?.holdings) throw new Error('Invalid account position response');
    return { holdings: position.holdings, source: 'positions' };
  } catch (error) {
    if (String(error).includes('does not have a position in Balanced')) {
      return {
        holdings: Object.fromEntries(
          Object.keys(collateralTokens).map(symbol => [symbol, { [symbol]: '0x0', bnUSD: '0x0' }]),
        ),
        source: 'positions',
      };
    }
  }

  // These reads return raw balances and never ask the price oracle for ICX.
  const balance = await read('getBalanceAndSupply', { _name: 'Loans', _owner: owner });
  const totalDebt = BigInt(balance._balance);
  if (totalDebt === 0n) {
    throw new Error('Unable to load collateral-only positions while the account-position query is unavailable.');
  }
  const holdings: LegacyPositions['holdings'] = {};
  await Promise.all(
    Object.entries(collateralTokens).map(async ([symbol, collateralAddress]) => {
      const count = Number(BigInt(await read('getBorrowerCount', { collateralAddress })));
      if (!Number.isSafeInteger(count) || count < 0) throw new Error('Invalid borrower count');
      const visited = new Set<string>();
      let startId = '0x0';
      for (let scanned = 0; scanned < count; ) {
        const borrowers = await read('getBorrowers', {
          collateralAddress,
          nrOfPositions: `0x${Math.min(50, count - scanned).toString(16)}`,
          startId,
        });
        if (!Array.isArray(borrowers) || borrowers.length === 0) break;
        for (const borrower of borrowers) {
          if (visited.has(borrower.id)) return;
          visited.add(borrower.id);
          scanned++;
          if (borrower.address === owner) {
            // Preserve exact contract symbols and owner capitalization.
            if (BigInt(borrower[symbol]) < 0n || BigInt(borrower.debt) < 0n)
              throw new Error('Invalid borrower balances');
            holdings[symbol] = { [symbol]: borrower[symbol], bnUSD: borrower.debt };
            return;
          }
        }
        startId = borrowers[borrowers.length - 1].nextId;
      }
    }),
  );
  const recoveredDebt = Object.values(holdings).reduce((sum, holding) => sum + BigInt(holding.bnUSD), 0n);
  if (recoveredDebt !== totalDebt) throw new Error('Unable to recover the complete loan balance. Please retry.');
  // The borrower lists cannot enumerate collateral with no corresponding debt.
  return { holdings, source: 'borrowers' };
}
