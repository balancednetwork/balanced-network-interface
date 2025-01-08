import { xTokenMapBySymbol } from '@/constants';
import { XTransactionInput, XTransactionType } from '@/xcall/types';
import { CurrencyAmount, Token, XChainId } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import { useMemo } from 'react';
import { useSendXTransaction } from '../useSendXTransaction';

export const useXRemoveLiquidity = () => {
  const { sendXTransaction } = useSendXTransaction();

  const xRemoveLiquidity = useMemo(
    () => async (account, poolId: number, xChainId: XChainId, withdrawAmount: CurrencyAmount<Token>) => {
      const BALN = xTokenMapBySymbol[xChainId]['BALN'];
      const inputAmount = CurrencyAmount.fromRawAmount(
        BALN,
        new BigNumber(withdrawAmount.toFixed())
          .times((10n ** BigInt(withdrawAmount.currency.decimals)).toString())
          .toFixed(0),
      );

      const xTransactionInput: XTransactionInput = {
        type: XTransactionType.LP_REMOVE_LIQUIDITY,
        account: account,
        inputAmount,
        poolId,
        xCallFee: { rollback: 60000000000000n, noRollback: 0n },
        direction: {
          from: xChainId,
          to: '0x1.icon',
        },
      };

      return await sendXTransaction(xTransactionInput);
    },
    [sendXTransaction],
  );

  return xRemoveLiquidity;
};
