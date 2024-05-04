import { useCallback } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { CrossChainTxType, XChainId } from 'app/pages/trade/bridge-v2/types';

import { AppState } from '../index';
import { addTransactionResult, initTransaction } from './actions';

export const useTransactionsCrosschainState = (): AppState['transactionsCrosschain'] => {
  return useSelector<AppState, AppState['transactionsCrosschain']>(state => state.transactionsCrosschain);
};

export const useArchwayTransactionsState = (): AppState['transactionsCrosschain']['archway-1'] => {
  return useSelector<AppState, AppState['transactionsCrosschain']['archway-1']>(
    state => state.transactionsCrosschain['archway-1'],
  );
};

export const useIsArchwayTxPending = (): boolean => {
  const { isTxPending } = useArchwayTransactionsState();
  return isTxPending;
};

export const useAddTransactionResult = (): ((chain: XChainId, tx: CrossChainTxType | null, msg: string) => void) => {
  const dispatch = useDispatch();
  return useCallback(
    (chain: XChainId, tx: CrossChainTxType | null, msg: string) => {
      dispatch(addTransactionResult({ chain, tx, msg }));
    },
    [dispatch],
  );
};

export const useInitTransaction = (): ((chain: XChainId, msg: string) => void) => {
  const dispatch = useDispatch();
  return useCallback(
    (chain: XChainId, msg: string) => {
      dispatch(initTransaction({ chain, msg }));
    },
    [dispatch],
  );
};
