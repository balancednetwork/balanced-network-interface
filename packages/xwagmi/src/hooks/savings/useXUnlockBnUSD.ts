import { ICON_XCALL_NETWORK_ID } from '@/constants';
import { XToken } from '@/types';
import { getXCallFee } from '@/xcall';
import { XTransactionInput, XTransactionType } from '@/xcall/types';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { useMemo } from 'react';
import { useSendXTransaction } from '../useSendXTransaction';

export const useXUnlockBnUSD = () => {
  const sendXTransaction = useSendXTransaction();

  const xUnlockBnUSD = useMemo(
    () => async (account, inputAmount: CurrencyAmount<XToken>) => {
      const direction = { from: inputAmount.currency.xChainId, to: ICON_XCALL_NETWORK_ID };
      const xTransactionInput: XTransactionInput = {
        type: XTransactionType.UNLOCK_BNUSD,
        account: account,
        inputAmount,
        xCallFee: await getXCallFee(direction.from, direction.to),
        direction,
      };

      return await sendXTransaction(xTransactionInput);
    },
    [sendXTransaction],
  );

  return xUnlockBnUSD;
};
