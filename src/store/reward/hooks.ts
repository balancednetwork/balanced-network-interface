import React, { useMemo } from 'react';

import BigNumber from 'bignumber.js';
import _ from 'lodash';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import { useDispatch, useSelector } from 'react-redux';

import bnJs from 'bnJs';
import { BASE_SUPPORTED_PAIRS } from 'constants/currency';
import { PLUS_INFINITY, REWARDS_COLLATERAL_RATIO } from 'constants/index';
import { useCollateralInputAmount } from 'store/collateral/hooks';
import { useLoanInputAmount } from 'store/loan/hooks';
import { useRatio } from 'store/ratio/hooks';
import { useAllTransactions } from 'store/transactions/hooks';

import { AppState } from '..';
import { setReward } from './actions';

// #redux-step-5: define function get value of variable from store
export function useReward(): AppState['reward'] {
  const reward = useSelector((state: AppState) => state.reward);
  return useMemo(() => reward, [reward]);
}

export function useChangeReward(): (poolId: string, reward: BigNumber) => void {
  const dispatch = useDispatch();

  return React.useCallback(
    (poolId, reward) => {
      dispatch(setReward({ poolId, reward }));
    },
    [dispatch],
  );
}

export function useFetchReward(account?: string | null) {
  // fetch rewards rule
  const [rules, setRules] = React.useState({});
  const [emission, setEmission] = React.useState(new BigNumber(0));
  React.useEffect(() => {
    const fetchRewardsRule = async () => {
      let result = await Promise.all([bnJs.Rewards.getRecipientsSplit(), bnJs.Rewards.getEmission()]);
      const [_rules, _emission] = result;
      const a = {};
      _.forOwn(_rules, function (value, key) {
        a[key] = BalancedJs.utils.toIcx(value);
      });

      setRules(a);
      setEmission(BalancedJs.utils.toIcx(_emission));
    };
    fetchRewardsRule();
  }, []);

  const changeReward = useChangeReward();
  // calculate rewards per pool
  React.useEffect(() => {
    BASE_SUPPORTED_PAIRS.forEach(pair => {
      const poolId = pair.poolId;
      let rewardShare: BigNumber;
      if (poolId === BalancedJs.utils.POOL_IDS.sICXICX) {
        rewardShare = rules['sICX/ICX'];
      } else {
        rewardShare = rules[`${pair.baseCurrencyKey}/${pair.quoteCurrencyKey}`];
      }
      changeReward(poolId.toString(), emission.times(rewardShare));
    });

    const rewardShare = rules['Loans'];
    changeReward('Loans', emission.times(rewardShare));
  }, [rules, emission, changeReward]);
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
