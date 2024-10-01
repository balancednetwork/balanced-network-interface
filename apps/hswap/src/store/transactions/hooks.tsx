import React, { useCallback, useMemo } from 'react';

import { useIconNetworkId } from '@/hooks/useIconNetworkId';
import { useIconReact } from '@/packages/icon-react';

import { t } from '@lingui/macro';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import { NotificationError, NotificationPending } from '@/app/components/Notification/TransactionNotification';
import { getTrackerLink } from '@/utils';

import { AppDispatch, AppState } from '../index';
import { ICONTxEventLog, addTransaction } from './actions';
import { TransactionDetails } from './reducer';

interface TransactionResponse {
  hash: string;
}

// helper that can take a ethers library transaction response and add it to the list of transactions
export function useTransactionAdder(): (
  response: TransactionResponse,
  customData?: {
    summary?: string;
    pending?: string;
    redirectOnSuccess?: string;
    isTxSuccessfulBasedOnEvents?: (eventLogs: ICONTxEventLog[]) => boolean;
  },
) => void {
  const { account } = useIconReact();
  const networkId = useIconNetworkId();

  const dispatch = useDispatch<AppDispatch>();

  return useCallback(
    (
      response: TransactionResponse,
      {
        summary,
        pending,
        redirectOnSuccess,
        isTxSuccessfulBasedOnEvents,
      }: {
        summary?: string;
        pending?: string;
        redirectOnSuccess?: string;
        isTxSuccessfulBasedOnEvents?: (eventLogs: ICONTxEventLog[]) => boolean;
      } = {},
    ) => {
      if (!account) return;
      if (!networkId) return;

      const { hash } = response;
      if (!hash) {
        toast(<NotificationError failureReason={t`Learn how to resolve common transaction errors.`} generic={true} />, {
          toastId: 'genericError',
          autoClose: 5000,
        });
        throw Error('No transaction hash found.');
      }

      const link = getTrackerLink(networkId, hash, 'transaction');
      const toastProps = {
        onClick: () => window.open(link, '_blank'),
      };

      toast(<NotificationPending summary={pending || t`Processing transaction...`} />, {
        ...toastProps,
        toastId: hash,
      });

      dispatch(
        addTransaction({ hash, from: account, networkId, summary, redirectOnSuccess, isTxSuccessfulBasedOnEvents }),
      );
    },
    [dispatch, networkId, account],
  );
}

// returns all the transactions for the current chain
export function useAllTransactions(): { [txHash: string]: TransactionDetails } | undefined {
  const networkId = useIconNetworkId();

  const state = useSelector<AppState, AppState['transactions']>(state => state.transactions);

  return networkId ? state[networkId] : undefined;
}

export enum TransactionStatus {
  pending = 'pending',
  success = 'success',
  failure = 'failure',
}
