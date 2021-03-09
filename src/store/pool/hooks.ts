import React from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { Pair } from 'constants/currency';

import { AppDispatch, AppState } from '../index';
import { setPair } from './actions';

export function usePoolPair(): Pair {
  return useSelector((state: AppState) => state.pool.selectedPair);
}

export function useSetPair(): (pair: Pair) => void {
  const dispatch = useDispatch<AppDispatch>();

  return React.useCallback(
    pair => {
      dispatch(setPair(pair));
    },
    [dispatch],
  );
}
