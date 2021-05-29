import React from 'react';

import BigNumber from 'bignumber.js';
import _ from 'lodash';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import { useDispatch, useSelector } from 'react-redux';

import bnJs from 'bnJs';
import { CURRENCY } from 'constants/currency';
import { useAllTransactions } from 'store/transactions/hooks';

import { AppState } from '..';
import { changeBalances, resetBalances } from './actions';

export function useWalletBalances(): AppState['wallet'] {
  return useSelector((state: AppState) => state.wallet);
}

export function useWalletFetchBalances(account?: string | null) {
  const dispatch = useDispatch();
  const transactions = useAllTransactions();

  React.useEffect(() => {
    const fetchBalances = async () => {
      if (account) {
        const results = await Promise.all(CURRENCY.map(currencyKey => bnJs[currencyKey].balanceOf(account)));
        const data = {};
        results.forEach((result, index) => {
          data[CURRENCY[index]] = BalancedJs.utils.toIcx(result);
        });
        dispatch(changeBalances(data));
      } else {
        dispatch(resetBalances());
      }
    };

    fetchBalances();
  }, [transactions, account, dispatch]);
}

export const useBALNDetails = (): { [key in string]?: BigNumber } => {
  const { account } = useIconReact();
  const transactions = useAllTransactions();
  const [details, setDetails] = React.useState({});

  React.useEffect(() => {
    const fetchDetails = async () => {
      if (account) {
        const result = await bnJs.BALN.detailsBalanceOf(account);

        const temp = {};

        _.forEach(result, function (value, key) {
          if (key === 'Unstaking time (in microseconds)') temp[key] = new BigNumber(value);
          else temp[key] = BalancedJs.utils.toIcx(value);
        });

        setDetails(temp);
      }
    };

    fetchDetails();
  }, [account, transactions]);

  return details;
};

export const useClaimableRewards = (): BigNumber | undefined => {
  const { account } = useIconReact();
  const transactions = useAllTransactions();
  const [rewards, setRewards] = React.useState<BigNumber | undefined>();

  React.useEffect(() => {
    const fetchRewards = async () => {
      if (account) {
        const result = await bnJs.Rewards.getBalnHolding(account);

        setRewards(BalancedJs.utils.toIcx(result));
      }
    };

    fetchRewards();
  }, [account, transactions]);

  return rewards;
};
