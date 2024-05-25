import { useCrossChainWalletBalances } from 'store/wallet/hooks';
import { XChain, XChainId } from '../types';
import { xChainMap } from '../_config/xChains';
import { useMemo } from 'react';
import { getNetworkDisplayName } from '../utils';

function useXCallGasChecker(xChainId: XChainId): { hasEnoughGas: boolean; errorMessage: string } {
  const balances = useCrossChainWalletBalances();

  const { hasEnoughGas, errorMessage } = useMemo(() => {
    try {
      const xChain: XChain = xChainMap[xChainId];
      const nativeCurrency = xChain?.nativeCurrency;

      const hasEnoughGas =
        balances[xChainId] &&
        balances[xChainId]?.['native'].greaterThan(xChain.gasThreshold * 10 ** nativeCurrency.decimals);
      const errorMessage = !hasEnoughGas
        ? `You need at least ${xChain.gasThreshold} ${
            nativeCurrency.symbol
          } in your wallet to pay for transaction fees on ${getNetworkDisplayName(xChainId)}.`
        : '';

      return { hasEnoughGas: !!hasEnoughGas, errorMessage };
    } catch (e) {}

    return { hasEnoughGas: false, errorMessage: '' };
  }, [balances, xChainId]);

  return {
    hasEnoughGas,
    errorMessage,
  };
}

export default useXCallGasChecker;
