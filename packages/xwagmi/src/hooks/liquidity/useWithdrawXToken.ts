import { XToken } from '@/types';
import { XTransactionInput, XTransactionType } from '@/xcall/types';
import { CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import { useMemo } from 'react';
import { useSendXTransaction } from '../useSendXTransaction';

export const useWithdrawXToken = () => {
  const { sendXTransaction } = useSendXTransaction();

  const withdrawXToken = useMemo(
    () => async (account, currencyAmount: CurrencyAmount<XToken>) => {
      const xTransactionInput: XTransactionInput = {
        type: XTransactionType.LP_WITHDRAW_XTOKEN,
        account: account,
        inputAmount: currencyAmount,
        xCallFee: { rollback: 60000000000000n, noRollback: 0n },
        direction: {
          from: currencyAmount.currency.xChainId,
          to: '0x1.icon',
        },
      };

      return await sendXTransaction(xTransactionInput);
    },
    [sendXTransaction],
  );

  return withdrawXToken;
};
