import { useCrossChainWalletBalances } from '@/store/wallet/hooks';
import { Currency, CurrencyAmount } from '@balancednetwork/sdk-core';
import {
  XChain,
  XChainId,
  XToken,
  formatBigNumber,
  getNetworkDisplayName,
  xChainMap,
  xTokenMap,
} from '@balancednetwork/xwagmi';
import BigNumber from 'bignumber.js';
import { useMemo } from 'react';

function useXCallGasChecker(
  xChainId: XChainId,
  inputAmount: CurrencyAmount<XToken> | CurrencyAmount<Currency> | undefined,
): { hasEnoughGas: boolean; errorMessage: string } {
  const balances = useCrossChainWalletBalances();

  return useMemo(() => {
    try {
      // if (!inputAmount) {
      //   throw new Error('inputAmount is undefined');
      // }

      const xChain: XChain = xChainMap[xChainId];
      const nativeCurrency: XToken = xTokenMap[xChainId].find(x => x.isNativeToken);

      const gasThreshold = inputAmount?.currency.isNativeToken
        ? xChain.gasThreshold + Number(inputAmount.toFixed())
        : xChain.gasThreshold;

      const hasEnoughGas =
        balances[xChainId] &&
        balances[xChainId]?.[nativeCurrency.address].greaterThan(
          Math.round(gasThreshold * 10 ** nativeCurrency.decimals),
        );

      const errorMessage = !hasEnoughGas
        ? `You need at least ${formatBigNumber(new BigNumber(xChain.gasThreshold), 'currency')} ${
            nativeCurrency.symbol
          } in your wallet to pay for transaction fees on ${getNetworkDisplayName(xChainId)}.`
        : '';

      return { hasEnoughGas: !!hasEnoughGas, errorMessage };
    } catch (e) {
      console.log(e);
    }

    return { hasEnoughGas: false, errorMessage: 'Unknown' };
  }, [balances, xChainId, inputAmount]);
}

export default useXCallGasChecker;
