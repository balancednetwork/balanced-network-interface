import { createAction } from '@reduxjs/toolkit';

import { CrossChainTxType, XChainId } from 'app/pages/trade/bridge-v2/types';

export const addTransactionResult = createAction<{
  chain: XChainId;
  tx: CrossChainTxType | null;
  msg: string;
}>('transactions/addTransactionResult');

export const initTransaction = createAction<{
  chain: XChainId;
  msg: string;
}>('transactions/initTransaction');
