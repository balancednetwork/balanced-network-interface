import { xTokenMapBySymbol } from '@/constants';
import { XToken } from '@/types';
import { bnJs } from '@/xchains/icon';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { UseQueryResult, useQuery } from '@tanstack/react-query';

export const useXTokenDepositAmount = (
  account: string | undefined | null,
  xToken: XToken | undefined,
): UseQueryResult<CurrencyAmount<XToken> | undefined, Error> => {
  const fetchDepositAmount = async () => {
    if (xToken && account) {
      const xTokenOnIcon = xTokenMapBySymbol['0x1.icon'][xToken.symbol];
      const res = await bnJs.Dex.getDepositV2(xTokenOnIcon.address, `${xToken.xChainId}/${account}`);
      return res ? CurrencyAmount.fromRawAmount<XToken>(xToken, BigInt(res)) : undefined;
    }
    return undefined;
  };

  return useQuery({
    queryKey: ['XTokenDepositAmount', xToken, account],
    queryFn: fetchDepositAmount,
    enabled: !!xToken && !!account,
  });
};
