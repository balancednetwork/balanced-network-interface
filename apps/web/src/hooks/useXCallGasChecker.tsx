import { useICX } from '@/constants/tokens';
import { useCrossChainWalletBalances } from '@/store/wallet/hooks';
import { xChainMap } from '@/xwagmi/constants/xChains';
import { XChain, XChainId } from '@/xwagmi/types';
import { formatBigNumber, getNetworkDisplayName } from '@/xwagmi/utils';
import { Currency, CurrencyAmount, XToken } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import { useMemo } from 'react';

function useXCallGasChecker(
  xChainId: XChainId,
  inputAmount: CurrencyAmount<XToken> | CurrencyAmount<Currency> | undefined,
): { hasEnoughGas: boolean; errorMessage: string } {
  const balances = useCrossChainWalletBalances();

  return useMemo(() => {
    try {
      if (!inputAmount) {
        throw new Error('inputAmount is undefined');
      }

      const xChain: XChain = xChainMap[xChainId];
      const nativeCurrency = xChain?.nativeCurrency;

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
      // console.log(e);
    }

    return { hasEnoughGas: false, errorMessage: 'Unknown' };
  }, [balances, xChainId, inputAmount]);
}

export default useXCallGasChecker;
