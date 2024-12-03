import { useICX } from '@/constants/tokens';
import { useCrossChainWalletBalances } from '@/store/wallet/hooks';
import { Currency, CurrencyAmount } from '@balancednetwork/sdk-core';
import { xChainMap } from '@balancednetwork/xwagmi';
import { XChain, XChainId, XToken } from '@balancednetwork/xwagmi';
import { formatBigNumber, getNetworkDisplayName } from '@balancednetwork/xwagmi';
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
