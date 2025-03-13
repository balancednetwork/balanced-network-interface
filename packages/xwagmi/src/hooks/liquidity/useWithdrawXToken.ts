import { ICON_XCALL_NETWORK_ID } from '@/constants';
import { XToken } from '@/types';
import { getXCallFee } from '@/xcall';
import { XTransactionInput, XTransactionType } from '@/xcall/types';
import { CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import { useMemo } from 'react';
import { useSendXTransaction } from '../useSendXTransaction';

export const useWithdrawXToken = () => {
  const sendXTransaction = useSendXTransaction();

  const withdrawXToken = useMemo(
    () => async (account, currencyAmount: CurrencyAmount<XToken>) => {
      const direction = { from: currencyAmount.currency.xChainId, to: ICON_XCALL_NETWORK_ID };
      const xTransactionInput: XTransactionInput = {
        type: XTransactionType.LP_WITHDRAW_XTOKEN,
        account: account,
        inputAmount: currencyAmount,
        xCallFee: await getXCallFee(direction.from, direction.to),
        direction,
      };

      return await sendXTransaction(xTransactionInput);
    },
    [sendXTransaction],
  );

  return withdrawXToken;
};
