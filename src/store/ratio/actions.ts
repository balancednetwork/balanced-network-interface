import { createAction } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

export const changeRatioValue = createAction<{
  ICXUSDratio?: BigNumber;
  sICXbnUSDratio?: BigNumber;
  sICXICXratio?: BigNumber;
  BALNbnUSDratio?: BigNumber;
  BALNsICXratio?: BigNumber;
}>('ratio/changeRatioValue');
