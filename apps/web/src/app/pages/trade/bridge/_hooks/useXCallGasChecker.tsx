import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { keepPreviousData, useQuery, UseQueryResult } from '@tanstack/react-query';
import { useCrossChainWalletBalances, useSignedInWallets } from 'store/wallet/hooks';
import { XChainId } from '../types';
import { xChains } from '../_config/xChains';

function useXCallGasChecker(
  chain1: XChainId,
  chain2: XChainId,
  icon: boolean = false,
): UseQueryResult<{ hasEnoughGas: boolean; errorMessage: string }> {
  const wallets = useSignedInWallets();
  const balances = useCrossChainWalletBalances();

  return useQuery<{ hasEnoughGas: boolean; errorMessage: string }>({
    queryKey: ['gasChecker', chain1, chain2, icon, wallets, balances],
    queryFn: async () => {
      let errorMessage = '';
      const hasEnoughGasAllArray: boolean[] = [];

      [chain1, chain2].forEach(chain => {
        const xChain = xChains[chain];
        const nativeCurrency = xChain.nativeCurrency;
        // !TODO: use native property to fetch native currency balance
        const gasAmount = balances[chain] && balances[chain]?.['native'];
        const hasEnoughGas =
          xChain.autoExecution ||
          (gasAmount
            ? !CurrencyAmount.fromRawAmount(
                gasAmount.currency,
                xChain.gasThreshold * 10 ** nativeCurrency.decimals,
              ).greaterThan(gasAmount)
            : false);
        hasEnoughGasAllArray.push(hasEnoughGas);
        if (!hasEnoughGas) {
          errorMessage = `You need at least ${xChain.gasThreshold} ${nativeCurrency.symbol} to pay for transaction fees on ${nativeCurrency.name}.`;
        }
      });

      const hasEnoughGas = !hasEnoughGasAllArray.some(hasEnough => !hasEnough);

      return { hasEnoughGas, errorMessage };
    },
    placeholderData: keepPreviousData,
    refetchInterval: 3000,
  });
}

export default useXCallGasChecker;
