import { useCallback, useMemo } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { AppState } from '..';
import { changeRatioValue } from './actions';
import { RatioState } from './reducer';

// #redux-step-5: define function get value of variable from store
export function useRatioValue(): AppState['ratio'] {
  const ratio = useSelector((state: AppState) => state.ratio);
  return useMemo(() => ratio, [ratio]);
}

// #redux-step-6: define function working with variable on store
export function useChangeRatio(): ({ ICXUSDratio, sICXbnUSDratio, sICXICXratio, BALNbnUSDratio }: RatioState) => void {
  const dispatch = useDispatch();
  return useCallback(
    ({ ICXUSDratio, sICXbnUSDratio, sICXICXratio, BALNbnUSDratio }) => {
      dispatch(changeRatioValue({ ICXUSDratio, sICXbnUSDratio, sICXICXratio, BALNbnUSDratio }));
    },
    [dispatch],
  );
}
