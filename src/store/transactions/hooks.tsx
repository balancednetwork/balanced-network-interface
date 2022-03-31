import React, { useCallback } from 'react';

import { t } from '@lingui/macro';
import { useIconReact } from 'packages/icon-react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import { NotificationPending, NotificationError } from 'app/components/Notification/TransactionNotification';
import { getTrackerLink } from 'utils';

import { AppDispatch, AppState } from '../index';
import { addTransaction } from './actions';
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
  },
) => void {
  const { networkId, account } = useIconReact();
  const dispatch = useDispatch<AppDispatch>();

  return useCallback(
    (response: TransactionResponse, { summary, pending }: { summary?: string; pending?: string } = {}) => {
      if (!account) return;
      if (!networkId) return;

      const { hash } = response;
      if (!hash) {
        toast(
          <NotificationError failureReason={t`Couldn't send the transaction. Make sure your wallet is set to the right network.`} />,
          {
            toastId: 'possibleWrongNetwork',
            autoClose: 5000,
          },
        );
        throw Error('No transaction hash found.');
      }

      const link = getTrackerLink(networkId, hash, 'transaction');
      const toastProps = {
        onClick: () => window.open(link, '_blank'),
      };

      toast(<NotificationPending summary={pending || t`Your transaction has been sent to the network.`} />, {
        ...toastProps,
        toastId: hash,
      });

      dispatch(addTransaction({ hash, from: account, networkId, summary }));
    },
    [dispatch, networkId, account],
  );
}

// returns all the transactions for the current chain
export function useAllTransactions(): { [txHash: string]: TransactionDetails } | undefined {
  const { networkId } = useIconReact();

  const state = useSelector<AppState, AppState['transactions']>(state => state.transactions);

  return networkId ? state[networkId] : undefined;
}

export enum TransactionStatus {
  'pending' = 'pending',
  'success' = 'success',
  'failure' = 'failure',
}

export function useTransactionStatus(transactionHash?: string): TransactionStatus | undefined {
  const transactions = useAllTransactions();

  if (transactions && transactionHash && transactions[transactionHash]) {
    if (transactions[transactionHash].receipt) {
      if (transactions[transactionHash].receipt?.status === 1) return TransactionStatus.success;
      else return TransactionStatus.failure;
    } else {
      return TransactionStatus.pending;
    }
  } else {
    return undefined;
  }
}
