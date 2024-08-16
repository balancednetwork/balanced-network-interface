import { CallData, addresses } from '@balancednetwork/balanced-js';
import BigNumber from 'bignumber.js';
import bnJs from '@/bnJs';
import { UseQueryResult, keepPreviousData, useQuery } from '@tanstack/react-query';
import { formatUnits } from '@/utils';

type DebtCeiling = {
  ceiling: BigNumber;
  symbol: string;
};

export function useDebtCeilings(): UseQueryResult<{
  total: BigNumber;
  ceilings: DebtCeiling[];
}> {
  return useQuery({
    queryKey: ['debtCeilings'],
    queryFn: async () => {
      const data = await bnJs.Loans.getCollateralTokens();

      const cds: CallData[] = Object.keys(data).map(symbol => ({
        target: addresses[1].loans,
        method: 'getDebtCeiling',
        params: [symbol],
      }));

      const debtCeilingsData = await bnJs.Multicall.getAggregateData(cds);
      const debtCeilings = debtCeilingsData.map(ceiling => new BigNumber(formatUnits(ceiling)));

      const ceilings: DebtCeiling[] = [];
      Object.keys(data).forEach((symbol, index) => {
        if (debtCeilings[index] > 0) {
          ceilings.push({ symbol, ceiling: debtCeilings[index] });
        }
      });

      const totalRaw = await bnJs.bnUSD.getDebtCeiling();
      const total = new BigNumber(formatUnits(totalRaw));

      return { total, ceilings };
    },
    placeholderData: keepPreviousData,
  });
}
