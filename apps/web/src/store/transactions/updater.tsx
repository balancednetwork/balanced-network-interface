import React from 'react';

import { Converter } from 'icon-sdk-js';
import { useIconReact } from 'packages/icon-react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';

import { NotificationError, NotificationSuccess } from 'app/components/Notification/TransactionNotification';
import { useBlockNumber } from 'store/application/hooks';
import { getTrackerLink } from 'utils';

import { AppDispatch } from '../index';
import { finalizeTransaction, ICONTxEventLog } from './actions';
import { useAllTransactions } from './hooks';

export function shouldCheck(tx: { addedTime: number; receipt?: {}; lastCheckedBlockNumber?: number }): boolean {
  if (tx.receipt) return false;
  return true;
}

export default function Updater(): null {
  const { networkId, iconService } = useIconReact();

  const lastBlockNumber = useBlockNumber();

  const dispatch = useDispatch<AppDispatch>();

  const transactions = useAllTransactions();

  React.useEffect(() => {
    if (!networkId || !iconService || !transactions) return;

    Object.keys(transactions)
      .filter(hash => shouldCheck(transactions[hash]))
      .forEach(hash => {
        iconService
          .getTransactionResult(hash)
          .execute()
          .then(txResult => {
            if (txResult) {
              dispatch(
                finalizeTransaction({
                  networkId,
                  hash,
                  receipt: {
                    blockHash: txResult.blockHash,
                    blockHeight: txResult.blockHeight,
                    scoreAddress: txResult.scoreAddress,
                    // from: receipt.from,
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

              const link = getTrackerLink(networkId, hash, 'transaction');
              const toastProps = {
                onClick: () => window.open(link, '_blank'),
              };

              const predicate = transactions[hash].isTxSuccessfulBasedOnEvents;

              // success
              if (
                (!predicate && txResult.status === 1) ||
                (predicate && predicate(txResult.eventLogs as ICONTxEventLog[]))
              ) {
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

              // failure
              if (txResult.status === 0 || (predicate && !predicate(txResult.eventLogs as ICONTxEventLog[]))) {
                toast.update(txResult.txHash, {
                  ...toastProps,
                  render: <NotificationError failureReason={(txResult?.failure as any)?.message} />,
                  autoClose: 5000,
                });
              }
            }
          })
          .catch(error => {
            console.error(`failed to check transaction hash: ${hash}`, error);
          });
      });
  }, [networkId, iconService, transactions, dispatch, lastBlockNumber]);

  return null;
}
