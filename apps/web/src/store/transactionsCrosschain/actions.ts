import { createAction } from '@reduxjs/toolkit';

import { CrossChainTxType } from '@/lib/xcall/types';
import { XChainId } from '@/types';

export const addTransactionResult = createAction<{
  chain: XChainId;
  tx: CrossChainTxType | null;
  msg: string;
}>('transactions/addTransactionResult');

export const initTransaction = createAction<{
  chain: XChainId;
  msg: string;
}>('transactions/initTransaction');
