import { ICON_XCALL_NETWORK_ID, xTokenMapBySymbol } from '@/constants';
import { getXCallFee } from '@/xcall';
import { XTransactionInput, XTransactionType } from '@/xcall/types';
import { CurrencyAmount, XChainId } from '@balancednetwork/sdk-core';
import { useMemo } from 'react';
import { useSendXTransaction } from '../useSendXTransaction';

export const useXClaimRewards = () => {
  const sendXTransaction = useSendXTransaction();

  const xClaimRewards = useMemo(
    () => async (account, xChainId: XChainId) => {
      const direction = { from: xChainId, to: ICON_XCALL_NETWORK_ID };
      const bnUSD = xTokenMapBySymbol[ICON_XCALL_NETWORK_ID]['bnUSD(old)'];
      const inputAmount = CurrencyAmount.fromRawAmount(bnUSD, '0');
      const xTransactionInput: XTransactionInput = {
        type: XTransactionType.LP_CLAIM_REWARDS,
        account,
        inputAmount, // not used, just to make the type happy
        xCallFee: await getXCallFee(direction.from, direction.to),
        direction,
      };

      return await sendXTransaction(xTransactionInput);
    },
    [sendXTransaction],
  );

  return xClaimRewards;
};
