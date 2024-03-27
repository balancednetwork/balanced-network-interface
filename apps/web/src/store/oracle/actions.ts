import { createAction } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

export const changeOraclePrice = createAction<{
  symbol: string;
  price: BigNumber;
}>('oracle/changeOraclePrice');
