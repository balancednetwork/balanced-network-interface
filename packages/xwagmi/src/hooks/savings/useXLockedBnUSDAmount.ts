import { xTokenMapBySymbol } from '@/constants';
import { XToken } from '@/types';
import { convertCurrencyAmount } from '@/utils';
import { bnJs } from '@/xchains/icon';
import { CurrencyAmount, XChainId } from '@balancednetwork/sdk-core';
import { UseQueryResult, useQuery } from '@tanstack/react-query';

const fetchLockedAmount = async ({ address, xChainId }) => {
  if (xChainId && address) {
    const res = await bnJs.Savings.getLockedAmount(xChainId === '0x1.icon' ? address : `${xChainId}/${address}`);
    const bnUSDOnIcon = xTokenMapBySymbol['0x1.icon']['bnUSD'];
    return res ? convertCurrencyAmount(xChainId, CurrencyAmount.fromRawAmount<XToken>(bnUSDOnIcon, BigInt(res))) : null;
  }
  return null;
};
export const useXLockedBnUSDAmount = (wallet: { address: string | undefined; xChainId: XChainId }): UseQueryResult<
  CurrencyAmount<XToken> | null,
  Error
> => {
  return useQuery({
    queryKey: ['xLockedBnUSDAmount', wallet],
    queryFn: () => fetchLockedAmount(wallet),
  });
};

export const useXLockedBnUSDAmounts = (
  wallets: { address: string | undefined; xChainId: XChainId }[],
): UseQueryResult<Partial<Record<XChainId, CurrencyAmount<XToken>>>, Error> => {
  return useQuery({
    queryKey: ['xLockedBnUSDAmount', wallets],
    queryFn: async () => {
      const data = await Promise.all(wallets.map(wallet => fetchLockedAmount(wallet)));
      return wallets.reduce((acc, wallet, i) => {
        acc[wallet.xChainId] = data[i];
        return acc;
      }, {});
    },
    enabled: wallets.length > 0,
  });
};
