import React from 'react';

import { useIconReact } from 'packages/icon-react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';

import { NotificationError, NotificationSuccess } from 'app/components/Notification/TransactionNotification';
import useInterval from 'hooks/useInterval';
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

  const dispatch = useDispatch<AppDispatch>();

  //call useEffect per 5000ms
  const [last, setLast] = React.useState(0);
  const increment = React.useCallback(() => setLast(last => last + 1), [setLast]);
  useInterval(increment, 5000);

  const transactions = useAllTransactions();

  React.useEffect(() => {
    if (!networkId || !iconService) return;

    const txs = transactions || {};
    Object.keys(txs)
      .filter(hash => shouldCheck(txs[hash]))
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
                    from: receipt.from,
                    status: receipt.status,
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
                  render: <NotificationSuccess summary={txs[hash]?.summary} />,
                  autoClose: 10000,
                });
              }

              // failure
              if (receipt.status === 0) {
                toast.update(receipt.txHash, {
                  ...toastProps,
                  render: <NotificationError failureReason={receipt.failure.message} />,
                  autoClose: 10000,
                });
              }
            }
          })
          .catch(error => {
            console.error(`failed to check transaction hash: ${hash}`, error);
          });
      });
  }, [networkId, iconService, transactions, dispatch, last]);

  return null;
}
