import { xTokenMapBySymbol } from '@/constants';
import { XToken } from '@/types';
import { convertCurrencyAmount } from '@/utils';
import { bnJs } from '@/xchains/icon';
import { CurrencyAmount, XChainId } from '@balancednetwork/sdk-core';
import { UseQueryResult, useQuery } from '@tanstack/react-query';

export const useXLockedBnUSDAmount = (
  account: string | undefined | null,
  xChainId: XChainId | undefined,
): UseQueryResult<CurrencyAmount<XToken> | null, Error> => {
  const fetchLockedAmount = async () => {
    if (xChainId && account) {
      const res = await bnJs.Savings.getLockedAmount(xChainId === '0x1.icon' ? account : `${xChainId}/${account}`);

      const bnUSDOnIcon = xTokenMapBySymbol['0x1.icon']['bnUSD'];
      return res
        ? convertCurrencyAmount(xChainId, CurrencyAmount.fromRawAmount<XToken>(bnUSDOnIcon, BigInt(res)))
        : null;
    }
    return null;
  };

  return useQuery({
    queryKey: ['xLockedBnUSDAmount', xChainId, account],
    queryFn: fetchLockedAmount,
    enabled: !!xChainId && !!account,
  });
};
