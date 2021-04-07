import React, { useCallback, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import _ from 'lodash';
import { useIconReact } from 'packages/icon-react';
import { convertLoopToIcx } from 'packages/icon-react/utils';
import { useDispatch, useSelector } from 'react-redux';

import bnJs from 'bnJs';
import { useAllTransactions } from 'store/transactions/hooks';

import { AppState } from '..';
import { changeValueBalance } from './actions';
import { WalletState } from './reducer';

// #redux-step-5: define function get value of variable from store
export function useWalletBalances(): AppState['walletBalance'] {
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
        bnJs.sICX.getICXBalance(),
        bnJs.sICX.balanceOf(),
        bnJs.Baln.balanceOf(),
        bnJs.bnUSD.balanceOf(),
        bnJs.Rewards.getBalnHolding(account),
      ]).then(result => {
        const [ICXbalance, sICXbalance, BALNbalance, bnUSDbalance, BALNreward] = result.map(v => convertLoopToIcx(v));
        changeBalanceValue({ ICXbalance, sICXbalance, BALNbalance, bnUSDbalance, BALNreward });
      });
    }
  }, [account, changeBalanceValue]);

  React.useEffect(() => {
    fetchBalances();
  }, [fetchBalances, transactions, account]);
}

export const useBALNDetails = (): { [key in string]?: BigNumber } => {
  const { account } = useIconReact();
  const transactions = useAllTransactions();
  const [details, setDetails] = React.useState({});

  React.useEffect(() => {
    const fetchDetails = async () => {
      if (account) {
        const result = await bnJs.Baln.detailsBalanceOf(account);

        const temp = {};

        _.forEach(result, function (value, key) {
          temp[key] = convertLoopToIcx(new BigNumber(value));
        });

        setDetails(temp);
      }
    };

    fetchDetails();
  }, [account, transactions]);

  return details;
};
