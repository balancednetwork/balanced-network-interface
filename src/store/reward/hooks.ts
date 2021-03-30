import { useCallback, useMemo } from 'react';

import { useDispatch, useSelector } from 'react-redux';

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
