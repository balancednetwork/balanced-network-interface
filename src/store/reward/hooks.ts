import React, { useCallback, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import { useDispatch, useSelector } from 'react-redux';

import bnJs from 'bnJs';
import { PLUS_INFINITY, REWARDS_COLLATERAL_RATIO } from 'constants/index';
import { useCollateralInputAmount } from 'store/collateral/hooks';
import { useLoanInputAmount } from 'store/loan/hooks';
import { useRatio } from 'store/ratio/hooks';
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
  loan,
  poolDailyReward,
}: Partial<RewardState>) => void {
  const dispatch = useDispatch();
  return useCallback(
    ({ sICXbnUSDreward, BALNbnUSDreward, sICXICXreward, loan, poolDailyReward }) => {
      dispatch(changeReward({ sICXbnUSDreward, BALNbnUSDreward, sICXICXreward, loan, poolDailyReward }));
    },
    [dispatch],
  );
}

export function useFetchReward(account?: string | null) {
  const transactions = useAllTransactions();
  const changeReward = useChangeReward();

  const fetchReward = React.useCallback(() => {
    if (account) {
      Promise.all([bnJs.Rewards.getRecipientsSplit(), bnJs.Rewards.getEmission()]).then(result => {
        const [poolsReward, poolEmission] = result.map(v => v);
        const sICXICXreward = BalancedJs.utils.toIcx(poolsReward['SICXICX']);
        const sICXbnUSDreward = BalancedJs.utils.toIcx(poolsReward['SICXbnUSD']);
        const BALNbnUSDreward = BalancedJs.utils.toIcx(poolsReward['BALNbnUSD']);
        const loan = BalancedJs.utils.toIcx(poolsReward['Loans']);
        const poolDailyReward = BalancedJs.utils.toIcx(poolEmission);
        changeReward({
          sICXICXreward,
          sICXbnUSDreward,
          BALNbnUSDreward,
          loan,
          poolDailyReward,
        });
      });
    }
  }, [account, changeReward]);

  React.useEffect(() => {
    fetchReward();
  }, [fetchReward, transactions, account]);
}

export const useCurrentCollateralRatio = (): BigNumber => {
  const collateralInputAmount = useCollateralInputAmount();
  const loanInputAmount = useLoanInputAmount();
  const ratio = useRatio();

  return React.useMemo(() => {
    if (loanInputAmount.isZero()) return PLUS_INFINITY;

    return collateralInputAmount.times(ratio.ICXUSDratio).dividedBy(loanInputAmount).multipliedBy(100);
  }, [collateralInputAmount, loanInputAmount, ratio.ICXUSDratio]);
};
export const useHasRewardableLoan = () => {
  const loanInputAmount = useLoanInputAmount();
  const collateralRatio = useCurrentCollateralRatio();

  if (
    loanInputAmount.isGreaterThanOrEqualTo(new BigNumber(50)) &&
    collateralRatio.isGreaterThanOrEqualTo(new BigNumber(REWARDS_COLLATERAL_RATIO * 100))
  ) {
    return true;
  }

  return false;
};

export const useHasRewardableLiquidity = () => {
  const { account } = useIconReact();

  const [hasRewardableLiquidity, setHasRewardableLiquidity] = React.useState(false);

  React.useEffect(() => {
    const checkIfRewardable = async () => {
      if (account) {
        const result = await Promise.all([
          await bnJs.Dex.isEarningRewards(account, BalancedJs.utils.POOL_IDS.BALNbnUSD),
          await bnJs.Dex.isEarningRewards(account, BalancedJs.utils.POOL_IDS.sICXbnUSD),
          await bnJs.Dex.isEarningRewards(account, BalancedJs.utils.POOL_IDS.sICXICX),
        ]);

        if (result.find(pool => Number(pool))) setHasRewardableLiquidity(true);
        else setHasRewardableLiquidity(false);
      }
    };

    checkIfRewardable();
  }, [account]);

  return hasRewardableLiquidity;
};

export const useHasNetworkFees = () => {
  const { account } = useIconReact();
  const transactions = useAllTransactions();
  const [hasNetworkFees, setHasNetworkFees] = React.useState(false);

  React.useEffect(() => {
    const checkIfHasNetworkFees = async () => {
      if (account) {
        const [hasLP, balnDetails] = await Promise.all([
          bnJs.Dex.isEarningRewards(account, BalancedJs.utils.POOL_IDS.BALNbnUSD),
          bnJs.BALN.detailsBalanceOf(account),
        ]);

        if (Number(hasLP) || Number(balnDetails['Staked balance'])) setHasNetworkFees(true);
        else setHasNetworkFees(false);
      }
    };

    checkIfHasNetworkFees();
  }, [account, transactions]);

  return hasNetworkFees;
};
