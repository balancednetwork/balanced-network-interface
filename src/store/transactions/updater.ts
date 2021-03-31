import React from 'react';

import { useIconReact } from 'packages/icon-react';
import { useDispatch } from 'react-redux';

import useInterval from 'hooks/useInterval';

import { useAddPopup } from '../application/hooks';
import { AppDispatch } from '../index';
import { useAllTransactions } from '../transactions/hooks';
import { finalizeTransaction } from './actions';

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
  useInterval(increment, 1000);

  const transactions = useAllTransactions();

  // show popup on confirm
  const addPopup = useAddPopup();

  React.useEffect(() => {
    if (!networkId || !iconService) return;

    Object.keys(transactions)
      // .filter(hash => shouldCheck(lastBlockNumber, transactions[hash]))
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
                    from: receipt.from,
                    status: receipt.status,
                    to: receipt.to,
                    txHash: receipt.txHash,
                    txIndex: receipt.txIndex,
                  },
                }),
              );

              addPopup(
                {
                  txn: {
                    hash,
                    success: receipt.status === 1,
                    summary: transactions[hash]?.summary,
                  },
                },
                hash,
              );
            }
          })
          .catch(error => {
            console.error(`failed to check transaction hash: ${hash}`, error);
          });
      });
  }, [networkId, iconService, transactions, dispatch, addPopup, last]);

  return null;
}
