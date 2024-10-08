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
  const ICX = useICX();

  return useMemo(() => {
    try {
      const xChain: XChain = xChainMap[xChainId];
      const nativeCurrency = xChain?.nativeCurrency;

      const nativeAddress = xChainId === '0x1.icon' ? ICX.address : 'native';

      const gasThreshold =
        nativeAddress === inputAmount?.currency.wrapped.address
          ? xChain.gasThreshold + Number(inputAmount.toFixed())
          : xChain.gasThreshold;

      const hasEnoughGas =
        balances[xChainId] &&
        balances[xChainId]?.[nativeAddress].greaterThan(Math.round(gasThreshold * 10 ** nativeCurrency.decimals));

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
  }, [balances, xChainId, ICX, inputAmount]);
}

export default useXCallGasChecker;
