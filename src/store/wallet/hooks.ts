import React from 'react';

import BigNumber from 'bignumber.js';
import _ from 'lodash';
import { BalancedJs } from 'packages/BalancedJs';
import IRC2 from 'packages/BalancedJs/contracts/IRC2';
import ContractSettings from 'packages/BalancedJs/contractSettings';
import { useIconReact } from 'packages/icon-react';
import { useDispatch, useSelector } from 'react-redux';

import bnJs from 'bnJs';
import { NETWORK_ID } from 'constants/config';
import { MINIMUM_ICX_FOR_TX } from 'constants/index';
import { SUPPORTED_TOKENS_LIST } from 'constants/tokens';
import { useAllTransactions } from 'store/transactions/hooks';

import { AppState } from '..';
import { changeBalances, resetBalances } from './actions';

const contractSettings = new ContractSettings({ networkId: NETWORK_ID });

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
        const list = SUPPORTED_TOKENS_LIST;

        const results = await Promise.all(
          SUPPORTED_TOKENS_LIST.map(token => {
            if (token.symbol === 'ICX') {
              return bnJs.ICX.balanceOf(account);
            } else {
              return new IRC2(contractSettings, token.address).balanceOf(account);
            }
          }),
        );

        const data = results.reduce((prev, result, index) => {
          const symbol = list[index].symbol;

          prev[symbol] = BalancedJs.utils.toIcx(result, symbol);
          if (symbol === 'BALN') {
            prev[symbol] = availableBALN;
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
  return balances['ICX'].isGreaterThan(MINIMUM_ICX_FOR_TX);
};
