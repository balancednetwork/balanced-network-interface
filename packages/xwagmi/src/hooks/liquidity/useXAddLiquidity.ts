import { XToken } from '@/types';
import { XTransactionInput, XTransactionType } from '@/xcall/types';
import { CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import { useMemo } from 'react';
import { useSendXTransaction } from '../useSendXTransaction';

export const useXAddLiquidity = () => {
  const { sendXTransaction } = useSendXTransaction();

  const xAddLiquidity = useMemo(
    () => async (account, inputAmount: CurrencyAmount<XToken>, outputAmount: CurrencyAmount<XToken>) => {
      const xTransactionInput: XTransactionInput = {
        type: XTransactionType.LP_ADD_LIQUIDITY,
        account: account,
        inputAmount,
        outputAmount,
        xCallFee: { rollback: 60000000000000n, noRollback: 0n },
        direction: {
          from: inputAmount.currency.xChainId,
          to: '0x1.icon',
        },
      };

      return await sendXTransaction(xTransactionInput);
    },
    [sendXTransaction],
  );

  return xAddLiquidity;
};
