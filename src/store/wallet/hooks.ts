import React, { useCallback, useMemo } from 'react';

import { convertLoopToIcx } from 'packages/icon-react/utils';
import { useDispatch, useSelector } from 'react-redux';

import bnJs from 'bnJs';
import { useAllTransactions } from 'store/transactions/hooks';

import { AppState } from '..';
import { changeValueBalance } from './actions';
import { WalletState } from './reducer';

// #redux-step-5: define function get value of variable from store
export function useWalletBalanceValue(): AppState['walletBalance'] {
  const walletBalance = useSelector((state: AppState) => state.walletBalance);
  return useMemo(() => walletBalance, [walletBalance]);
}

// #redux-step-6: define function working with variable on store
export function useChangeWalletBalance(): ({
  ICXbalance,
  sICXbalance,
  bnUSDbalance,
  BALNbalance,
  BALNreward,
}: Partial<WalletState>) => void {
  const dispatch = useDispatch();
  return useCallback(
    ({ ICXbalance, sICXbalance, bnUSDbalance, BALNbalance, BALNreward }) => {
      dispatch(changeValueBalance({ ICXbalance, sICXbalance, bnUSDbalance, BALNbalance, BALNreward }));
    },
    [dispatch],
  );
}

export function useFetchBalance(account?: string | null) {
  // eject this account and we don't need to account params for when call contract
  bnJs.eject({ account });

  const changeBalanceValue = useChangeWalletBalance();

  const transactions = useAllTransactions();

  const fetchBalances = React.useCallback(() => {
    if (account) {
      Promise.all([
        bnJs.sICX.balanceOf(),
        bnJs.Baln.balanceOf(),
        bnJs.bnUSD.balanceOf(),
        bnJs.Rewards.getRewards(),
      ]).then(result => {
        const [sICXbalance, BALNbalance, bnUSDbalance, BALNreward] = result.map(v => convertLoopToIcx(v));
        changeBalanceValue({ sICXbalance });
        changeBalanceValue({ BALNbalance });
        changeBalanceValue({ bnUSDbalance });
        changeBalanceValue({ BALNreward });
      });
    }
  }, [account, changeBalanceValue]);

  React.useEffect(() => {
    fetchBalances();
  }, [fetchBalances, transactions]);
}
