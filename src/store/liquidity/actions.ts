import { createAction } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

// #redux-step-4: define action
export const changeLiquiditySupply = createAction<{
  sICXPoolsICXbnUSDTotal?: BigNumber;
  bnUSDPoolsICXbnUSDTotal?: BigNumber;
  sICXbnUSDBalance?: BigNumber;
  sICXbnUSDTotalSupply?: BigNumber;
  BALNPoolBALNbnUSDTotal?: BigNumber;
  bnUSDPoolBALNbnUSDTotal?: BigNumber;
  BALNbnUSDBalance?: BigNumber;
  BALNbnUSDTotalSupply?: BigNumber;
  sICXSuppliedPoolsICXbnUSD?: BigNumber;
  bnUSDSuppliedPoolsICXbnUSD?: BigNumber;
  BALNSuppliedPoolBALNbnUSD?: BigNumber;
  bnUSDSuppliedPoolBALNbnUSD?: BigNumber;
  sICXICXTotalSupply?: BigNumber;
  ICXBalance?: BigNumber;
}>('liquidity/changeLiquiditySupply'); // #redux-note: make sure action name is unique in global store
