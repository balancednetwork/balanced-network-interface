import { useWalletBalances } from '@/store/wallet/hooks';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { xChainMap, xTokenMap } from '@balancednetwork/xwagmi';
import { XChain, XToken } from '@balancednetwork/xwagmi';
import { formatBigNumber, getNetworkDisplayName } from '@balancednetwork/xwagmi';
import BigNumber from 'bignumber.js';
import { useMemo } from 'react';

function useXCallGasChecker(inputAmount: CurrencyAmount<XToken> | undefined): {
  hasEnoughGas: boolean;
  errorMessage: string;
} {
  const walletBalances = useWalletBalances();

  return useMemo(() => {
    try {
      const xChainId = inputAmount?.currency.xChainId;
      if (!xChainId) return { hasEnoughGas: false, errorMessage: 'Unknown' };

      const xChain: XChain = xChainMap[xChainId];
      const nativeCurrency: XToken = xTokenMap[xChainId].find(x => x.isNativeToken);

      const gasThreshold = inputAmount?.currency.isNativeToken
        ? xChain.gasThreshold + Number(inputAmount.toFixed())
        : xChain.gasThreshold;

      const hasEnoughGas = walletBalances?.[nativeCurrency.id].greaterThan(
        Math.round(gasThreshold * 10 ** nativeCurrency.decimals),
      );

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
  }, [walletBalances, inputAmount]);
}

export default useXCallGasChecker;
