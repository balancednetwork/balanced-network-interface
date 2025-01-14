import { ICON_XCALL_NETWORK_ID } from '@/constants';
import { XToken } from '@/types';
import { getXCallFee } from '@/xcall';
import { XTransactionInput, XTransactionType } from '@/xcall/types';
import { CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import { useMemo } from 'react';
import { useSendXTransaction } from '../useSendXTransaction';

export const useDepositXToken = () => {
  const sendXTransaction = useSendXTransaction();

  const depositXToken = useMemo(
    () => async (account, currencyAmount: CurrencyAmount<Token>, xToken: XToken) => {
      const inputAmount = CurrencyAmount.fromRawAmount(
        xToken,
        new BigNumber(currencyAmount.toFixed()).times((10n ** BigInt(xToken.decimals)).toString()).toFixed(0),
      );

      const direction = { from: xToken.xChainId, to: ICON_XCALL_NETWORK_ID };
      const xTransactionInput: XTransactionInput = {
        type: XTransactionType.LP_DEPOSIT_XTOKEN,
        account: account,
        inputAmount: inputAmount,
        xCallFee: await getXCallFee(direction.from, direction.to),
        direction,
      };

      return await sendXTransaction(xTransactionInput);
    },
    [sendXTransaction],
  );

  return depositXToken;
};
