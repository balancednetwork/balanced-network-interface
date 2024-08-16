import { createReducer } from '@reduxjs/toolkit';

import { TransactionStatus } from '@/store/transactions/hooks';

import { openToast } from '@/app/components/Toast/transactionToast';
import { archway } from '@/constants/xChains';
import { addTransactionResult, initTransaction } from './actions';

export interface TransactionDetails {
  hash: string;
}

export interface TransactionsCrosschainState {
  ['archway-1']: {
    isTxPending: boolean;
    transactions: TransactionDetails[];
  };
}

export const initialState: TransactionsCrosschainState = { 'archway-1': { isTxPending: false, transactions: [] } };

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
          window.open(`${archway.tracker}/${tx.transactionHash}`, '_blank');
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
