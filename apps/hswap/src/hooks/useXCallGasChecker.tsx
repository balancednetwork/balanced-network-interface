import { useWalletBalances } from '@/store/wallet/hooks';
import { xChainMap } from '@/xwagmi/constants/xChains';
import { XChain, XToken } from '@/xwagmi/types';
import { formatBigNumber, getNetworkDisplayName } from '@/xwagmi/utils';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import { useMemo } from 'react';

function useXCallGasChecker(inputAmount: CurrencyAmount<XToken> | undefined): {
  hasEnoughGas: boolean;
  errorMessage: string;
} {
  // TODO: || '0x1.icon' is a temporary fix for type checking
  const xChainId = inputAmount?.currency.xChainId || '0x1.icon';

  const walletBalances = useWalletBalances();

  return useMemo(() => {
    try {
      const xChain: XChain = xChainMap[xChainId];
      const nativeCurrency = xChain?.nativeCurrency;

      const gasThreshold =
        `${xChainId}-native` === inputAmount?.currency.wrapped.address
          ? xChain.gasThreshold + Number(inputAmount.toFixed())
          : xChain.gasThreshold;

      const hasEnoughGas = walletBalances?.[`${xChainId}-native`].greaterThan(
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
  }, [walletBalances, xChainId, inputAmount]);
}

export default useXCallGasChecker;
