import { useCallback, useMemo, useState } from 'react';

import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { t } from '@lingui/macro';
import { useQuery } from '@tanstack/react-query';

import { openToast } from '@/btp/src/connectors/transactionToast';
import { transactionActions } from '@/hooks/useTransactionStore';
import { TransactionStatus } from '@/store/transactions/hooks';
import { XToken, getXChainType, useXAccount, useXPublicClient, useXWalletClient } from '@balancednetwork/xwagmi';

export const FAST_INTERVAL = 10000;

export enum ApprovalState {
  UNKNOWN,
  NOT_APPROVED,
  PENDING,
  APPROVED,
}

export const MaxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

export const useApproveCallback = (amountToApprove?: CurrencyAmount<XToken>, spender?: string) => {
  const token = amountToApprove?.currency?.isToken ? amountToApprove.currency : undefined;

  const [pending, setPending] = useState<boolean>(false);

  const { address: account } = useXAccount(getXChainType(amountToApprove?.currency.xChainId));

  const xChainId = amountToApprove?.currency.xChainId;
  const xPublicClient = useXPublicClient(xChainId);
  const xWalletClient = useXWalletClient(xChainId);
  const { allowance: currentAllowance, refetch } = useTokenAllowance(token, account, spender);

  // check the current approval status
  const approvalState: ApprovalState = useMemo(() => {
    if (!amountToApprove || !spender || !token) return ApprovalState.UNKNOWN;
    if (!xPublicClient) return ApprovalState.UNKNOWN;

    if (!xPublicClient.needsApprovalCheck(token)) return ApprovalState.APPROVED;

    if (!currentAllowance) return ApprovalState.UNKNOWN;
    return currentAllowance.lessThan(amountToApprove)
      ? pending
        ? ApprovalState.PENDING
        : ApprovalState.NOT_APPROVED
      : ApprovalState.APPROVED;
  }, [amountToApprove, currentAllowance, pending, spender, token, xPublicClient]);

  const approveCallback = useCallback(async () => {
    if (!token || !account || !spender || !xChainId) {
      console.error('no token or account or spender');
      return;
    }

    if (!xWalletClient) {
      console.error('no xWalletClient');
      return;
    }

    try {
      const hash = await xWalletClient.approve(amountToApprove, spender, account);

      setPending(true);

      if (hash) {
        await xPublicClient?.waitForTxReceipt(hash);
        await refetch();
        setPending(false);

        transactionActions.add(xChainId, {
          hash: hash,
          pendingMessage: t`Approving ${token.symbol} for cross-chain transfer...`,
          successMessage: t`${token.symbol} approved for cross-chain transfer.`,
          errorMessage: t`${token.symbol} transfer approval failed.`,
          onSuccess: async () => {
            // await refetch();
            // setPending(false);
          },
        });
      } else {
        throw new Error('Approval failed');
      }
    } catch (e) {
      setPending(false);
      openToast({
        message: t`${token.symbol} transfer approval failed.`,
        transactionStatus: TransactionStatus.failure,
      });
      throw e;
    }
  }, [spender, token, account, amountToApprove, refetch, xWalletClient, xPublicClient, xChainId]);

  // TODO: implement revokeCallback
  const revokeCallback = useCallback(() => {
    // return approveEvm(0n);
  }, []);

  return { approvalState, approveCallback, currentAllowance };
};

export function useTokenAllowance(
  token?: XToken,
  owner?: string | null,
  spender?: string,
): {
  allowance: CurrencyAmount<XToken> | undefined;
  refetch: () => Promise<any>;
} {
  const xPublicClient = useXPublicClient(token?.xChainId);

  const { data: allowance, refetch } = useQuery({
    queryKey: [token?.xChainId, token?.address, owner, spender],
    queryFn: async () => {
      const rawAllowance = await xPublicClient?.getTokenAllowance(owner, spender, token);
      return token && typeof rawAllowance !== 'undefined'
        ? CurrencyAmount.fromRawAmount(token, rawAllowance.toString())
        : undefined;
    },
    refetchInterval: FAST_INTERVAL,
    retry: true,
    refetchOnWindowFocus: false,
    enabled: Boolean(spender && owner && token),
  });

  return { allowance, refetch };
}
