import { ICON_XCALL_NETWORK_ID } from '@/constants';
import { XToken } from '@/types';
import { getXCallFee } from '@/xcall';
import { XTransactionInput, XTransactionType } from '@/xcall/types';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { useMemo } from 'react';
import { useSendXTransaction } from '../useSendXTransaction';

export const useDepositXToken = () => {
  const sendXTransaction = useSendXTransaction();

  const depositXToken = useMemo(
    () => async (account, currencyAmount: CurrencyAmount<XToken>) => {
      const direction = { from: currencyAmount.currency.xChainId, to: ICON_XCALL_NETWORK_ID };
      const xTransactionInput: XTransactionInput = {
        type: XTransactionType.LP_DEPOSIT_XTOKEN,
        account: account,
        inputAmount: currencyAmount,
        xCallFee: await getXCallFee(direction.from, direction.to),
        direction,
      };

      return await sendXTransaction(xTransactionInput);
    },
    [sendXTransaction],
  );

  return depositXToken;
};
