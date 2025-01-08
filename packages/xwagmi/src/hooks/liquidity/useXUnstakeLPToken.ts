import { xTokenMapBySymbol } from '@/constants';
import { XTransactionInput, XTransactionType } from '@/xcall/types';
import { CurrencyAmount, XChainId } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import { useMemo } from 'react';
import { useSendXTransaction } from '../useSendXTransaction';

export const useXUnstakeLPToken = () => {
  const { sendXTransaction } = useSendXTransaction();

  const xUnstakeLPToken = useMemo(
    () => async (account, poolId: number, xChainId: XChainId, rawUnstakeAmount: string, decimals: number) => {
      const BALN = xTokenMapBySymbol[xChainId]['BALN'];
      const inputAmount = CurrencyAmount.fromRawAmount(
        BALN,
        new BigNumber(rawUnstakeAmount).times((10n ** BigInt(decimals)).toString()).toFixed(0),
      );

      const xTransactionInput: XTransactionInput = {
        type: XTransactionType.LP_UNSTAKE,
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

  return xUnstakeLPToken;
};
