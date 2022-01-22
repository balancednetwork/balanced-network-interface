import React from 'react';

import { Converter } from 'icon-sdk-js';
import { useIconReact } from 'packages/icon-react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';

import { NotificationError, NotificationSuccess } from 'app/components/Notification/TransactionNotification';
import { useBlockNumber } from 'store/application/hooks';
import { getTrackerLink } from 'utils';

import { AppDispatch } from '../index';
import { finalizeTransaction } from './actions';
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
          .then(receipt => {
            if (receipt) {
              dispatch(
                finalizeTransaction({
                  networkId,
                  hash,
                  receipt: {
                    blockHash: receipt.blockHash,
                    blockHeight: receipt.blockHeight,
                    scoreAddress: receipt.scoreAddress,
                    // from: receipt.from,
                    status: Converter.toNumber(receipt.status),
                    to: receipt.to,
                    txHash: receipt.txHash,
                    txIndex: receipt.txIndex,
                  },
                }),
              );

              const link = getTrackerLink(networkId, hash, 'transaction');
              const toastProps = {
                onClick: () => window.open(link, '_blank'),
              };

              // success
              if (receipt.status === 1) {
                toast.update(receipt.txHash, {
                  ...toastProps,
                  render: <NotificationSuccess summary={transactions[hash]?.summary} />,
                  autoClose: 5000,
                });
              }

              // failure
              if (receipt.status === 0) {
                toast.update(receipt.txHash, {
                  ...toastProps,
                  render: <NotificationError failureReason={(receipt?.failure as any)?.message} />,
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
