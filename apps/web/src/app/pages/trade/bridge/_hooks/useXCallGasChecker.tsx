import { useCrossChainWalletBalances } from 'store/wallet/hooks';
import { XChain, XChainId } from '../types';
import { xChainMap } from '../_config/xChains';
import { useMemo } from 'react';
import { getNetworkDisplayName } from '../utils';
import { useICX } from 'constants/tokens';

function useXCallGasChecker(xChainId: XChainId): { hasEnoughGas: boolean; errorMessage: string } {
  const balances = useCrossChainWalletBalances();
  const ICX = useICX();

  const { hasEnoughGas, errorMessage } = useMemo(() => {
    try {
      const xChain: XChain = xChainMap[xChainId];
      const nativeCurrency = xChain?.nativeCurrency;

      // TODO: balances[xChainId]?.['native'] is undefined, used ICX.address instead
      const hasEnoughGas =
        xChainId === '0x1.icon'
          ? balances[xChainId] &&
            balances[xChainId]?.[ICX.address].greaterThan(xChain.gasThreshold * 10 ** nativeCurrency.decimals)
          : balances[xChainId] &&
            balances[xChainId]?.['native'].greaterThan(xChain.gasThreshold * 10 ** nativeCurrency.decimals);

      const errorMessage = !hasEnoughGas
        ? `You need at least ${xChain.gasThreshold} ${
            nativeCurrency.symbol
          } in your wallet to pay for transaction fees on ${getNetworkDisplayName(xChainId)}.`
        : '';

      return { hasEnoughGas: !!hasEnoughGas, errorMessage };
    } catch (e) {
      // console.log(e);
    }

    return { hasEnoughGas: false, errorMessage: 'Unknown' };
  }, [balances, xChainId, ICX]);

  return {
    hasEnoughGas,
    errorMessage,
  };
}

export default useXCallGasChecker;
