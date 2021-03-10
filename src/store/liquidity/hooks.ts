import { useCallback, useMemo } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { AppState } from '..';
import { changeLiquiditySupply } from './actions';
import { LiquidityState } from './reducer';

// #redux-step-5: define function get value of variable from store
export function useLiquiditySupply(): AppState['liquidity'] {
  const liquidity = useSelector((state: AppState) => state.liquidity);
  return useMemo(() => liquidity, [liquidity]);
}

// #redux-step-6: define function working with variable on store
export function useChangeLiquiditySupply(): ({
  ICXsupply,
  sICXbnUSDsupply,
  bnUSDsupply,
  BALNsupply,
}: LiquidityState) => void {
  const dispatch = useDispatch();
  return useCallback(
    ({ ICXsupply, sICXbnUSDsupply, bnUSDsupply, BALNsupply }) => {
      dispatch(changeLiquiditySupply({ ICXsupply, sICXbnUSDsupply, bnUSDsupply, BALNsupply }));
    },
    [dispatch],
  );
}
