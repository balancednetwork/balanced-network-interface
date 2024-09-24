import { useICX } from '@/constants/tokens';
import { useCrossChainWalletBalances } from '@/store/wallet/hooks';
import { xChainMap } from '@/xwagmi/constants/xChains';
import { XChain } from '@/xwagmi/types';
import { formatBigNumber, getNetworkDisplayName } from '@/xwagmi/utils';
import { XChainId } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import { useMemo } from 'react';

function useXCallGasChecker(xChainId: XChainId): { hasEnoughGas: boolean; errorMessage: string } {
  const balances = useCrossChainWalletBalances();
  const ICX = useICX();

  const { hasEnoughGas, errorMessage } = useMemo(() => {
    try {
      const xChain: XChain = xChainMap[xChainId];
      const nativeCurrency = xChain?.nativeCurrency;

      const hasEnoughGas =
        xChainId === '0x1.icon'
          ? balances[xChainId] &&
            balances[xChainId]?.[ICX.address].greaterThan(
              Math.round(xChain.gasThreshold * 10 ** nativeCurrency.decimals),
            )
          : balances[xChainId] &&
            balances[xChainId]?.['native'].greaterThan(Math.round(xChain.gasThreshold * 10 ** nativeCurrency.decimals));

      const errorMessage = !hasEnoughGas
        ? `You need at least ${formatBigNumber(new BigNumber(xChain.gasThreshold), 'currency')} ${
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
