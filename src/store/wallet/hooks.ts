import { useCallback, useMemo } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { AppState } from '..';
import { changeValueBalance } from './actions';
import { WalletState } from './reducer';

// #redux-step-5: define function get value of variable from store
export function useWalletBalanceValue(): AppState['walletBalance'] {
  const walletBalance = useSelector((state: AppState) => state.walletBalance);
  return useMemo(() => walletBalance, [walletBalance]);
}

// #redux-step-6: define function working with variable on store
export function useChangeWalletBalance(): ({ sICXbalance, bnUSDbalance, BALNbalance }: WalletState) => void {
  const dispatch = useDispatch();
  return useCallback(
    ({ sICXbalance, bnUSDbalance, BALNbalance }) => {
      dispatch(changeValueBalance({ sICXbalance, bnUSDbalance, BALNbalance }));
    },
    [dispatch],
  );
}
