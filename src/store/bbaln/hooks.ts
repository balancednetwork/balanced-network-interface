import React from 'react';

import { BigNumber } from 'bignumber.js';
import { useDispatch, useSelector } from 'react-redux';

import { LockedPeriod } from 'app/components/home/BBaln/types';

import { AppState } from '..';
import { Field } from '../loan/actions';
import { adjust, cancel, type, setBoost } from './actions';

export function useBBalnAmount(): AppState['bbaln']['bbalnAmount'] {
  return useSelector((state: AppState) => state.bbaln.bbalnAmount);
}

export function useLockedUntil(): AppState['bbaln']['lockedUntil'] {
  return useSelector((state: AppState) => state.bbaln.lockedUntil);
}

export function useLockedOn(): AppState['bbaln']['lockedOn'] {
  return useSelector((state: AppState) => state.bbaln.lockedOn);
}

export function useLockedBaln(): AppState['bbaln']['lockedBaln'] {
  return useSelector((state: AppState) => state.bbaln.lockedBaln);
}

export function useLockedPeriod(): AppState['bbaln']['lockedPeriod'] {
  return useSelector((state: AppState) => state.bbaln.lockedPeriod);
}

export function useBBalnSliderState(): AppState['bbaln']['state'] {
  return useSelector((state: AppState) => state.bbaln.state);
}

export function useBBalnSliderActionHandlers() {
  const dispatch = useDispatch();

  const onFieldAInput = React.useCallback(
    (value: string) => {
      dispatch(type({ independentField: Field.LEFT, typedValue: value, inputType: 'text' }));
    },
    [dispatch],
  );

  const onSlide = React.useCallback(
    (values: string[], handle: number) => {
      dispatch(type({ independentField: Field.LEFT, typedValue: values[handle], inputType: 'slider' }));
    },
    [dispatch],
  );

  const onAdjust = React.useCallback(
    isAdjust => {
      if (isAdjust) {
        dispatch(adjust());
      } else {
        dispatch(cancel());
      }
    },
    [dispatch],
  );

  return {
    onFieldAInput,
    onSlide,
    onAdjust,
  };
}

export function useSetBoost(): (
  bbalnAmount: BigNumber,
  lockedOn: Date,
  lockedPeriod: LockedPeriod,
  lockedBaln: BigNumber,
) => void {
  const dispatch = useDispatch();
  return React.useCallback(
    (bbalnAmount: BigNumber, lockedOn: Date, lockedPeriod: LockedPeriod, lockedBaln: BigNumber) => {
      const lockedUntil = new Date(new Date().setDate(lockedOn.getDate() + lockedPeriod.days));
      dispatch(setBoost({ bbalnAmount, lockedOn, lockedUntil, lockedPeriod, lockedBaln }));
    },
    [dispatch],
  );
}
