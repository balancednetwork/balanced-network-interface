import { useEffect } from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { XChainId, bnJs, useXTransactionStore } from '@balancednetwork/xwagmi';
import { useSignedInWallets } from '@/hooks/useWallets';
import { useAllTransactions } from '@/store/transactions/hooks';
import { SUPPORTED_TOKENS_LIST } from '@/constants/tokens';
import {
  LegacyPositions,
  normalizePositionHoldings,
  readLegacyPositions,
  summarizePositionReads,
} from './legacyPositions';

export type AccountPosition = LegacyPositions & {
  owner: string;
  xChainId: XChainId;
  amounts: ReturnType<typeof normalizePositionHoldings>;
};

export function useLegacyAccountPositions(collateralTokens: Record<string, string> | undefined) {
  const wallets = useSignedInWallets();
  const transactions = useAllTransactions();
  const pendingCount = useXTransactionStore().getPendingTransactions(wallets).length;
  const queryClient = useQueryClient();
  // biome-ignore lint/correctness/useExhaustiveDependencies: refresh when a submitted or pending transaction changes.
  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: ['legacyPositions'] });
  }, [queryClient, transactions, pendingCount]);

  return useQueries({
    queries: wallets.map(wallet => {
      const owner =
        wallet.xChainId === '0x1.icon' || wallet.xChainId === '0x2.icon'
          ? wallet.address
          : `${wallet.xChainId}/${wallet.address}`;
      return {
        queryKey: ['legacyPositions', owner, collateralTokens],
        queryFn: async (): Promise<AccountPosition> => {
          const position = await readLegacyPositions(
            (method, params) => bnJs.Loans.call(bnJs.Loans.paramsBuilder({ method, params })),
            owner,
            collateralTokens!,
          );
          const decimals = Object.fromEntries(
            await Promise.all(
              Object.keys(position.holdings).map(async symbol => {
                const address = collateralTokens?.[symbol];
                if (!address) throw new Error(`Unknown collateral: ${symbol}`);
                const token = SUPPORTED_TOKENS_LIST.find(
                  token => token.address.toLowerCase() === address.toLowerCase(),
                );
                return [symbol, token?.decimals ?? Number(await bnJs.getContract(address).decimals())];
              }),
            ),
          );
          return {
            ...position,
            owner,
            xChainId: wallet.xChainId,
            amounts: normalizePositionHoldings(position.holdings, decimals),
          };
        },
        enabled: !!collateralTokens,
        staleTime: 10_000,
        refetchInterval: 15_000,
        retry: 1,
      };
    }),
    combine: results =>
      summarizePositionReads(
        results,
        wallets.map(wallet => wallet.xChainId),
      ),
  });
}
