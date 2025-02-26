import { ICON_XCALL_NETWORK_ID, xTokenMapBySymbol } from '@/constants';
import { XToken } from '@/types';
import { getXCallFee } from '@/xcall';
import { XTransactionInput, XTransactionType } from '@/xcall/types';
import { CurrencyAmount, XChainId } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import { useMemo } from 'react';
import { useSendXTransaction } from '../useSendXTransaction';

export const useXUnstakeLPToken = () => {
  const sendXTransaction = useSendXTransaction();

  const xUnstakeLPToken = useMemo(
    () =>
      async (
        account,
        poolId: number,
        xChainId: XChainId,
        rawUnstakeAmount: string,
        decimals: number,
        tokenA: XToken,
        tokenB: XToken,
      ) => {
        const bnUSD = xTokenMapBySymbol[xChainId]['bnUSD'];
        const inputAmount = CurrencyAmount.fromRawAmount(
          bnUSD,
          new BigNumber(rawUnstakeAmount).times((10n ** BigInt(decimals)).toString()).toFixed(0),
        );
        const direction = { from: xChainId, to: ICON_XCALL_NETWORK_ID };
        const xTransactionInput: XTransactionInput = {
          type: XTransactionType.LP_UNSTAKE,
          account: account,
          inputAmount,
          poolId,
          xCallFee: await getXCallFee(direction.from, direction.to),
          direction,
          tokenASymbol: tokenA.symbol,
          tokenBSymbol: tokenB.symbol,
        };

        return await sendXTransaction(xTransactionInput);
      },
    [sendXTransaction],
  );

  return xUnstakeLPToken;
};
