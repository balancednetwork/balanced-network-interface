import { createAction } from '@reduxjs/toolkit';

import { CrossChainTxType, SupportedXCallChains } from 'app/_xcall/types';

export const addTransactionResult = createAction<{
  chain: SupportedXCallChains;
  tx: CrossChainTxType | null;
  msg: string;
}>('transactions/addTransactionResult');

export const initTransaction = createAction<{
  chain: SupportedXCallChains;
  msg: string;
}>('transactions/initTransaction');
