import { CurrencyAmount, XToken } from '@balancednetwork/sdk-core';
import { useXPublicClient } from './useXPublicClient';
import { useQuery } from '@tanstack/react-query';

export function useXEstimateApproveGas(
  amountToApprove: CurrencyAmount<XToken> | undefined,
  spender: string | undefined,
  owner: string | undefined,
): bigint | undefined {
  const xPublicClient = useXPublicClient(amountToApprove?.currency?.xChainId);

  const { data } = useQuery({
    queryKey: ['estimateApproveGas', amountToApprove, spender, owner],
    queryFn: async () => {
      if (!xPublicClient) return;
      if (!amountToApprove || !spender || !owner) return;

      return await xPublicClient.estimateApproveGas(amountToApprove, spender, owner);
    },
    enabled: Boolean(amountToApprove && spender && owner && xPublicClient),
  });

  return data;
}
