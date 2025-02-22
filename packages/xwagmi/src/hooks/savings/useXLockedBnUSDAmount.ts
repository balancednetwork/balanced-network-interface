import { xTokenMapBySymbol } from '@/constants';
import { XToken } from '@/types';
import { convertCurrencyAmount } from '@/utils';
import { bnJs } from '@/xchains/icon';
import { CurrencyAmount, XChainId } from '@balancednetwork/sdk-core';
import { UseQueryResult, useQuery } from '@tanstack/react-query';

const fetchLockedAmount = async (xChainId, account) => {
  if (xChainId && account) {
    const res = await bnJs.Savings.getLockedAmount(xChainId === '0x1.icon' ? account : `${xChainId}/${account}`);

    const bnUSDOnIcon = xTokenMapBySymbol['0x1.icon']['bnUSD'];
    return res ? convertCurrencyAmount(xChainId, CurrencyAmount.fromRawAmount<XToken>(bnUSDOnIcon, BigInt(res))) : null;
  }
  return null;
};
export const useXLockedBnUSDAmount = (
  account: string | undefined | null,
  xChainId: XChainId | undefined,
): UseQueryResult<CurrencyAmount<XToken> | null, Error> => {
  return useQuery({
    queryKey: ['xLockedBnUSDAmount', xChainId, account],
    queryFn: () => fetchLockedAmount(xChainId, account),
    enabled: !!xChainId && !!account,
  });
};

export const useXLockedBnUSDAmounts = (
  accounts: string[],
  xChainId: XChainId | undefined,
): UseQueryResult<CurrencyAmount<XToken> | null, Error> => {
  return useQuery({
    queryKey: ['xLockedBnUSDAmount', xChainId, accounts],
    queryFn: () => Promise.all(accounts.map(account => fetchLockedAmount(xChainId, account))),
    enabled: !!xChainId && accounts.length > 0,
  });
};
