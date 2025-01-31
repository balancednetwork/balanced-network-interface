import { CurrencyAmount, XChainId } from '@balancednetwork/sdk-core';
import { UseQueryResult, keepPreviousData, useQuery } from '@tanstack/react-query';
import { XToken } from '../types';
import { useXPublicClient } from './useXPublicClient';

export function useXBalances({
  xChainId,
  xTokens,
  address,
}: { xChainId: XChainId; xTokens: XToken[]; address: string | undefined }): UseQueryResult<{
  [key: string]: CurrencyAmount<XToken>;
}> {
  const xPublicClient = useXPublicClient(xChainId);
  return useQuery({
    queryKey: [`xBalances`, xChainId, xTokens.map(x => x.symbol), address],
    queryFn: async () => {
      if (!xPublicClient) {
        return {};
      }

      const balances = await xPublicClient.getBalances(address, xTokens);

      return balances;
    },
    enabled: !!xPublicClient,
    placeholderData: keepPreviousData,
    refetchInterval: 5_000,
  });
}
