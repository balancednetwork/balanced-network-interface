import { useCallback, useMemo } from 'react';

import { BalancedJs } from 'packages/BalancedJs';
import { convertLoopToIcx } from 'packages/icon-react/utils';
import { useDispatch, useSelector } from 'react-redux';

import bnJs from 'bnJs';
import useInterval from 'hooks/useInterval';

import { AppState } from '..';
import { changeRatioValue } from './actions';
import { RatioState } from './reducer';

// #redux-step-5: define function get value of variable from store
export function useRatioValue(): AppState['ratio'] {
  const ratio = useSelector((state: AppState) => state.ratio);
  return useMemo(() => ratio, [ratio]);
}

// #redux-step-6: define function working with variable on store
export function useChangeRatio(): ({
  ICXUSDratio,
  sICXbnUSDratio,
  sICXICXratio,
  BALNbnUSDratio,
}: Partial<RatioState>) => void {
  const dispatch = useDispatch();
  return useCallback(
    ({ ICXUSDratio, sICXbnUSDratio, sICXICXratio, BALNbnUSDratio }) => {
      dispatch(changeRatioValue({ ICXUSDratio, sICXbnUSDratio, sICXICXratio, BALNbnUSDratio }));
    },
    [dispatch],
  );
}

// 1 minute
const PERIOD = 60 * 1000;

export function useFetchPrice() {
  const changeRatioValue = useChangeRatio();

  // ICX / USD price
  useInterval(async () => {
    const res = await bnJs.Band.getReferenceData({ _base: 'ICX', _quote: 'USD' });
    const ICXUSDratio = convertLoopToIcx(res['rate']);
    changeRatioValue({ ICXUSDratio });
  }, PERIOD);

  // sICX / ICX price
  useInterval(async () => {
    const sICXICXratio = convertLoopToIcx(await bnJs.Staking.getTodayRate());
    changeRatioValue({ sICXICXratio });
  }, PERIOD);

  // BALN / bnUSD price
  // useInterval(async () => {
  //   const BALNbnUSDratio = convertLoopToIcx(await bnJs.Dex.getPrice(BalancedJs.utils.BALNbnUSDpoolId.toString()));
  //   changeRatioValue({ BALNbnUSDratio: BALNbnUSDratio });
  // }, PERIOD);

  // sICX / bnUSD price
  useInterval(async () => {
    const sICXbnUSDratio = convertLoopToIcx(await bnJs.Dex.getPrice(BalancedJs.utils.sICXbnUSDpoolId.toString()));
    changeRatioValue({ sICXbnUSDratio });
  }, PERIOD);
}
