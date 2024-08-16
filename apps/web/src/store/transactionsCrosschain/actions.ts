import { createAction } from '@reduxjs/toolkit';

import { XChainId } from '@/types';
import { CrossChainTxType } from '@/app/pages/trade/bridge/types';

export const addTransactionResult = createAction<{
  chain: XChainId;
  tx: CrossChainTxType | null;
  msg: string;
}>('transactions/addTransactionResult');

export const initTransaction = createAction<{
  chain: XChainId;
  msg: string;
}>('transactions/initTransaction');
