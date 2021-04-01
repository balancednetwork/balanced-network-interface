import React, { useCallback, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import { convertLoopToIcx } from 'packages/icon-react/utils';
import { useDispatch, useSelector } from 'react-redux';

import bnJs from 'bnJs';
import { useAllTransactions } from 'store/transactions/hooks';

import { AppState } from '..';
import { changeReward } from './actions';
import { RewardState } from './reducer';

// #redux-step-5: define function get value of variable from store
export function useReward(): AppState['reward'] {
  const reward = useSelector((state: AppState) => state.reward);
  return useMemo(() => reward, [reward]);
}

// #redux-step-6: define function working with variable on store
export function useChangeReward(): ({
  sICXbnUSDreward,
  BALNbnUSDreward,
  sICXICXreward,
  poolDailyReward,
}: Partial<RewardState>) => void {
  const dispatch = useDispatch();
  return useCallback(
    ({ sICXbnUSDreward, BALNbnUSDreward, sICXICXreward, poolDailyReward }) => {
      dispatch(changeReward({ sICXbnUSDreward, BALNbnUSDreward, sICXICXreward, poolDailyReward }));
    },
    [dispatch],
  );
}

export function useFetchReward(account?: string | null) {
  // eject this account and we don't need to account params for when call contract
  bnJs.eject({ account });
  const transactions = useAllTransactions();
  const changeReward = useChangeReward();

  const fetchReward = React.useCallback(() => {
    if (account) {
      Promise.all([bnJs.Rewards.getRecipientsSplit(), bnJs.Rewards.getEmission(new BigNumber(1))]).then(result => {
        const [poolsReward, poolEmission] = result.map(v => v);
        const sICXICXreward = convertLoopToIcx(poolsReward['SICXICX']);
        const sICXbnUSDreward = convertLoopToIcx(poolsReward['SICXbnUSD']);
        const BALNbnUSDreward = convertLoopToIcx(poolsReward['BALNbnUSD']);
        const poolDailyReward = convertLoopToIcx(poolEmission);
        changeReward({
          sICXICXreward,
          sICXbnUSDreward,
          BALNbnUSDreward,
          poolDailyReward,
        });
      });
    }
  }, [account, changeReward]);

  React.useEffect(() => {
    fetchReward();
  }, [fetchReward, transactions, account]);
}
