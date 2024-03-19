import { createReducer } from '@reduxjs/toolkit';
import { openToast } from 'btp/src/connectors/transactionToast';

import { ARCHWAY_TRACKER_LINK } from 'app/_xcall/archway/config';
import { TransactionStatus } from 'store/transactions/hooks';

import { initTransaction, addTransactionResult } from './actions';

export interface TransactionDetails {
  hash: string;
}

export interface TransactionsCrosschainState {
  ['archway']: {
    isTxPending: boolean;
    transactions: TransactionDetails[];
  };
}

export const initialState: TransactionsCrosschainState = { archway: { isTxPending: false, transactions: [] } };

export default createReducer(initialState, builder =>
  builder
    .addCase(initTransaction, (state, { payload: { chain, msg } }) => {
      state[chain].isTxPending = true;
      openToast({
        message: msg,
        transactionStatus: TransactionStatus.pending,
        options: {},
        id: `${chain}-tx-${state[chain].transactions.length}`,
      });
    })
    .addCase(addTransactionResult, (state, { payload: { chain, tx, msg } }) => {
      const toastProps = tx && {
        onClick: () => {
          window.open(`${ARCHWAY_TRACKER_LINK}/${tx.transactionHash}`, '_blank');
        },
      };

      openToast({
        message: msg,
        transactionStatus: tx ? TransactionStatus.success : TransactionStatus.failure,
        options: { ...toastProps },
        id: `${chain}-tx-${state[chain].transactions.length}`,
      });
      state[chain].isTxPending = false;
      tx && state[chain].transactions.push({ hash: tx.transactionHash });
    }),
);
