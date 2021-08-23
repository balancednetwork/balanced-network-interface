import React from 'react';

import BigNumber from 'bignumber.js';
import _ from 'lodash';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import { useDispatch, useSelector } from 'react-redux';

import bnJs from 'bnJs';
import { CURRENCY } from 'constants/currency';
import { MINIMUM_ICX_AMOUNT_IN_WALLET } from 'constants/index';
import { useAllTransactions } from 'store/transactions/hooks';

import { AppState } from '..';
import { changeBalances, resetBalances } from './actions';

export function useWalletBalances(): AppState['wallet'] {
  return useSelector((state: AppState) => state.wallet);
}

export function useWalletFetchBalances(account?: string | null) {
  const dispatch = useDispatch();
  const details = useBALNDetails();
  const availableBALN: BigNumber = React.useMemo(() => details['Available balance'] || new BigNumber(0), [details]);

  const transactions = useAllTransactions();

  React.useEffect(() => {
    const fetchBalances = async () => {
      if (account) {
        const results = await Promise.all(CURRENCY.map(currencyKey => bnJs[currencyKey].balanceOf(account)));

        const data = results.reduce((prev, result, index) => {
          prev[CURRENCY[index]] = BalancedJs.utils.toIcx(result, CURRENCY[index]);
          if (CURRENCY[index] === 'BALN') {
            prev[CURRENCY[index]] = availableBALN;
          }
          return prev;
        }, {});
        dispatch(changeBalances(data));
      } else {
        dispatch(resetBalances());
      }
    };

    fetchBalances();
  }, [transactions, account, availableBALN, dispatch]);
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

export const useHasEnoughICX = () => {
  const balances = useWalletBalances();
  return balances['ICX'].isGreaterThan(MINIMUM_ICX_AMOUNT_IN_WALLET);
};
