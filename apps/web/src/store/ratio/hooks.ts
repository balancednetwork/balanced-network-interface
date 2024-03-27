import { useCallback } from 'react';

import { BalancedJs } from '@balancednetwork/balanced-js';
import { useDispatch, useSelector } from 'react-redux';

import bnJs from 'bnJs';
import useInterval from 'hooks/useInterval';

import { AppState } from '..';
import { changeRatioValue } from './actions';
import { RatioState } from './reducer';

// #redux-step-5: define function get value of variable from store
export function useRatio(): AppState['ratio'] {
  return useSelector((state: AppState) => state.ratio);
}

// #redux-step-6: define function working with variable on store
export function useChangeRatio(): ({
  ICXUSDratio,
  sICXbnUSDratio,
  sICXICXratio,
  BALNbnUSDratio,
  BALNsICXratio,
}: Partial<RatioState>) => void {
  const dispatch = useDispatch();
  return useCallback(
    ({ ICXUSDratio, sICXbnUSDratio, sICXICXratio, BALNbnUSDratio, BALNsICXratio }) => {
      dispatch(changeRatioValue({ ICXUSDratio, sICXbnUSDratio, sICXICXratio, BALNbnUSDratio, BALNsICXratio }));
    },
    [dispatch],
  );
}

// fetch price data every 30 secs
const PERIOD = 30 * 1000;

export function useFetchPrice() {
  const changeRatioValue = useChangeRatio();

  // ICX / USD price
  useInterval(async () => {
    const res = await bnJs.Band.getReferenceData({ _base: 'ICX', _quote: 'USD' });
    const ICXUSDratio = BalancedJs.utils.toIcx(res['rate']);
    changeRatioValue({ ICXUSDratio });
  }, PERIOD);

  // sICX / ICX price
  useInterval(async () => {
    const sICXICXratio = BalancedJs.utils.toIcx(await bnJs.Staking.getTodayRate());
    changeRatioValue({ sICXICXratio });
  }, PERIOD);

  // sICX / bnUSD price
  useInterval(async () => {
    const sICXbnUSDratio = BalancedJs.utils.toIcx(await bnJs.Dex.getPrice(BalancedJs.utils.POOL_IDS.sICXbnUSD));
    changeRatioValue({ sICXbnUSDratio });
  }, PERIOD);

  // BALN / bnUSD price
  useInterval(async () => {
    const BALNbnUSDratio = BalancedJs.utils.toIcx(await bnJs.Dex.getPrice(BalancedJs.utils.POOL_IDS.BALNbnUSD));
    changeRatioValue({ BALNbnUSDratio });
  }, PERIOD);

  useInterval(async () => {
    const BALNsICXratio = BalancedJs.utils.toIcx(await bnJs.Dex.getPrice(BalancedJs.utils.POOL_IDS.BALNsICX));
    changeRatioValue({ BALNsICXratio });
  }, PERIOD);
}
