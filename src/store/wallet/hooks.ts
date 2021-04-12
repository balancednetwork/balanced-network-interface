import React from 'react';

import BigNumber from 'bignumber.js';
import _ from 'lodash';
import { useIconReact } from 'packages/icon-react';
import { convertLoopToIcx } from 'packages/icon-react/utils';
import { useDispatch, useSelector } from 'react-redux';

import bnJs from 'bnJs';
import { useAllTransactions } from 'store/transactions/hooks';

import { AppState } from '..';
import { changeBalances, resetBalances } from './actions';

// #redux-step-5: define function get value of variable from store
export function useWalletBalances(): AppState['wallet'] {
  return useSelector((state: AppState) => state.wallet);
}

export function useWalletFetchBalances(account?: string | null) {
  const dispatch = useDispatch();

  const transactions = useAllTransactions();

  React.useEffect(() => {
    const fetchBalances = () => {
      if (account) {
        bnJs.eject({ account });
        Promise.all([
          bnJs.sICX.getICXBalance(),
          bnJs.sICX.balanceOf(),
          bnJs.BALN.balanceOf(),
          bnJs.bnUSD.balanceOf(),
          bnJs.Rewards.getBalnHolding(account),
        ]).then(result => {
          const [ICX, sICX, BALN, bnUSD, BALNreward] = result.map(v => convertLoopToIcx(v));
          dispatch(changeBalances({ ICX, sICX, BALN, bnUSD, BALNreward }));
        });
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
          temp[key] = convertLoopToIcx(new BigNumber(value));
        });

        setDetails(temp);
      }
    };

    fetchDetails();
  }, [account, transactions]);

  return details;
};
