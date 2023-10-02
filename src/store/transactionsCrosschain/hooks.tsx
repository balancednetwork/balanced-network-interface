import { useCallback } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { CrossChainTxType, SupportedXCallChains } from 'app/_xcall/types';

import { AppState } from '../index';
import { addTransactionResult, initTransaction } from './actions';

export const useTransactionsCrosschainState = (): AppState['transactionsCrosschain'] => {
  return useSelector<AppState, AppState['transactionsCrosschain']>(state => state.transactionsCrosschain);
};

export const useArchwayTransactionsState = (): AppState['transactionsCrosschain']['archway'] => {
  return useSelector<AppState, AppState['transactionsCrosschain']['archway']>(
    state => state.transactionsCrosschain.archway,
  );
};

export const useIsArchwayTxPending = (): boolean => {
  const { isTxPending } = useArchwayTransactionsState();
  return isTxPending;
};

export const useAddTransactionResult = (): ((
  chain: SupportedXCallChains,
  tx: CrossChainTxType | null,
  msg: string,
) => void) => {
  const dispatch = useDispatch();
  return useCallback(
    (chain: SupportedXCallChains, tx: CrossChainTxType | null, msg: string) => {
      dispatch(addTransactionResult({ chain, tx, msg }));
    },
    [dispatch],
  );
};

export const useInitTransaction = (): ((chain: SupportedXCallChains, msg: string) => void) => {
  const dispatch = useDispatch();
  return useCallback(
    (chain: SupportedXCallChains, msg: string) => {
      dispatch(initTransaction({ chain, msg }));
    },
    [dispatch],
  );
};
