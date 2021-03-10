import { useCallback, useMemo } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { AppState } from '../index';
import { addPopup, PopupContent, removePopup, changeAccount } from './actions';

// returns a function that allows adding a popup
export function useAddPopup(): (content: PopupContent, key?: string) => void {
  const dispatch = useDispatch();

  return useCallback(
    (content: PopupContent, key?: string) => {
      dispatch(addPopup({ content, key }));
    },
    [dispatch],
  );
}

// returns a function that allows removing a popup via its key
export function useRemovePopup(): (key: string) => void {
  const dispatch = useDispatch();
  return useCallback(
    (key: string) => {
      dispatch(removePopup({ key }));
    },
    [dispatch],
  );
}

export function useChangeAccount(): (account: string) => void {
  const dispatch = useDispatch();
  return useCallback(
    (account: string) => {
      dispatch(changeAccount({ account }));
    },
    [dispatch],
  );
}

// get the list of active popups
export function useActivePopups(): AppState['application']['popupList'] {
  const list = useSelector((state: AppState) => state.application.popupList);
  return useMemo(() => list.filter(item => item.show), [list]);
}

export function useAccount(): AppState['application']['account'] {
  const account = useSelector((state: AppState) => state.application.account);
  return useMemo(() => account, [account]);
}
