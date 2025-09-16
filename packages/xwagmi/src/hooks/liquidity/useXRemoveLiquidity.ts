import { ICON_XCALL_NETWORK_ID, xTokenMapBySymbol } from '@/constants';
import { XToken } from '@/types';
import { convertCurrencyAmount } from '@/utils';
import { getXCallFee } from '@/xcall';
import { XTransactionInput, XTransactionType } from '@/xcall/types';
import { CurrencyAmount, Token, XChainId } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import { useMemo } from 'react';
import { useSendXTransaction } from '../useSendXTransaction';

export const useXRemoveLiquidity = () => {
  const sendXTransaction = useSendXTransaction();

  const xRemoveLiquidity = useMemo(
    () =>
      async (
        account,
        poolId: number,
        xChainId: XChainId,
        withdrawAmount: CurrencyAmount<Token>,
        tokenA: XToken,
        tokenB: XToken,
        withdrawAmountA: CurrencyAmount<Token>,
        withdrawAmountB: CurrencyAmount<Token>,
      ) => {
        const bnUSD = xTokenMapBySymbol[xChainId]['bnUSD(old)'];
        const inputAmount = CurrencyAmount.fromRawAmount(
          bnUSD,
          new BigNumber(withdrawAmount.toFixed())
            .times((10n ** BigInt(withdrawAmount.currency.decimals)).toString())
            .toFixed(0),
        );

        const direction = { from: xChainId, to: ICON_XCALL_NETWORK_ID };
        const xTransactionInput: XTransactionInput = {
          type: XTransactionType.LP_REMOVE_LIQUIDITY,
          account: account,
          inputAmount,
          poolId,
          xCallFee: await getXCallFee(direction.from, direction.to),
          direction,
          tokenASymbol: tokenA.symbol,
          tokenBSymbol: tokenB.symbol,
          withdrawAmountA: convertCurrencyAmount(direction.from, withdrawAmountA),
          withdrawAmountB: convertCurrencyAmount(direction.from, withdrawAmountB),
        };

        return await sendXTransaction(xTransactionInput);
      },
    [sendXTransaction],
  );

  return xRemoveLiquidity;
};
