import { ICON_XCALL_NETWORK_ID, xTokenMapBySymbol } from '@/constants';
import { getXCallFee } from '@/xcall';
import { XTransactionInput, XTransactionType } from '@/xcall/types';
import { CurrencyAmount, XChainId } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import { useMemo } from 'react';
import { useSendXTransaction } from '../useSendXTransaction';

export const useXStakeLPToken = () => {
  const { sendXTransaction } = useSendXTransaction();

  const xStakeLPToken = useMemo(
    () => async (account, poolId: number, xChainId: XChainId, rawStakeAmount: string, decimals: number) => {
      const BALN = xTokenMapBySymbol[xChainId]['BALN'];
      const inputAmount = CurrencyAmount.fromRawAmount(
        BALN,
        new BigNumber(rawStakeAmount).times((10n ** BigInt(decimals)).toString()).toFixed(0),
      );
      const direction = { from: xChainId, to: ICON_XCALL_NETWORK_ID };
      const xTransactionInput: XTransactionInput = {
        type: XTransactionType.LP_STAKE,
        account: account,
        inputAmount,
        poolId,
        xCallFee: await getXCallFee(direction.from, direction.to),
        direction,
      };

      return await sendXTransaction(xTransactionInput);
    },
    [sendXTransaction],
  );

  return xStakeLPToken;
};
