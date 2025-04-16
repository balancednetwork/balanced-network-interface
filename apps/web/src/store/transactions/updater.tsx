import React from 'react';

import { useIconNetworkId } from '@/hooks/useIconNetworkId';
import { useIconReact } from '@/packages/icon-react';

import { Converter } from 'icon-sdk-js';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';

import { NotificationError, NotificationSuccess } from '@/app/components/Notification/TransactionNotification';
import { useBlockNumber } from '@/store/application/hooks';
import { getTrackerLink } from '@/utils';
import { XChainId, XTransactionType, useXTransactionStore, xTransactionActions } from '@balancednetwork/xwagmi';

import { AppDispatch } from '../index';
import { ICONTxEventLog, finalizeTransaction } from './actions';
import { useAllTransactions } from './hooks';

export function shouldCheck(tx: { addedTime: number; receipt?: {}; lastCheckedBlockNumber?: number }): boolean {
  if (tx.receipt) return false;
  return true;
}

export default function Updater(): null {
  const { iconService } = useIconReact();
  const networkId = useIconNetworkId();

  const lastBlockNumber = useBlockNumber();

  const dispatch = useDispatch<AppDispatch>();

  const transactions = useAllTransactions();
  const xTransactions = useXTransactionStore(state =>
    Object.values(state.transactions).filter(tx => tx.type === XTransactionType.SWAP_ON_ICON),
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  React.useEffect(() => {
    if (!networkId || !iconService) return;

    // Check regular transactions
    if (transactions) {
      Object.keys(transactions)
        .filter(hash => shouldCheck(transactions[hash]))
        .forEach(hash => checkAndUpdateTransaction(hash));
    }

    // Check SWAP_ON_ICON transactions
    xTransactions
      .filter(tx => tx.status === 'pending')
      .forEach(tx => {
        const hash = tx.id;
        if (hash) {
          checkAndUpdateTransaction(hash);
        }
      });
  }, [networkId, iconService, transactions, xTransactions, dispatch, lastBlockNumber]);

  const checkAndUpdateTransaction = (hash: string) => {
    iconService
      .getTransactionResult(hash)
      .execute()
      .then(txResult => {
        if (txResult) {
          // Update regular transaction if it exists
          if (transactions?.[hash]) {
            dispatch(
              finalizeTransaction({
                networkId,
                hash,
                receipt: {
                  blockHash: txResult.blockHash,
                  blockHeight: txResult.blockHeight,
                  scoreAddress: txResult.scoreAddress,
                  status: Converter.toNumber(txResult.status),
                  to: txResult.to,
                  txHash: txResult.txHash,
                  txIndex: txResult.txIndex,
                  ...(transactions[hash].isTxSuccessfulBasedOnEvents && {
                    eventLogs: txResult.eventLogs as ICONTxEventLog[],
                  }),
                },
              }),
            );
          }

          const link = getTrackerLink(networkId, hash, 'transaction');
          const toastProps = {
            onClick: () => window.open(link, '_blank'),
          };

          // Find corresponding xTransaction if it exists
          const xTransaction = xTransactions.find(tx => tx.id === hash);

          // success
          if (txResult.status === 1) {
            // Update xTransaction status if it exists
            if (xTransaction) {
              xTransactionActions.success(xTransaction.id);
            }

            // Show success notification if regular transaction exists
            if (transactions?.[hash]) {
              toast.update(txResult.txHash, {
                ...toastProps,
                render: (
                  <NotificationSuccess
                    summary={transactions[hash]?.summary}
                    redirectOnSuccess={transactions[hash]?.redirectOnSuccess}
                  />
                ),
                autoClose: 5000,
              });
            }
          }

          // failure
          if (txResult.status === 0) {
            // Update xTransaction status if it exists
            if (xTransaction) {
              xTransactionActions.fail(xTransaction.id);
            }

            // // Show error notification if regular transaction exists
            if (transactions?.[hash]) {
              toast.update(txResult.txHash, {
                ...toastProps,
                render: <NotificationError failureReason={(txResult?.failure as any)?.message} />,
                autoClose: 5000,
              });
            }
          }
        }
      })
      .catch(error => {
        console.error(`failed to check transaction hash: ${hash}`, error);
      });
  };

  return null;
}
