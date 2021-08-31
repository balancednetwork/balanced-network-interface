import React from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { AppDispatch, AppState } from '../index';
import { setProposalType } from './actions';

export function useProposalType() {
  return useSelector((state: AppState) => state.proposal.selectedProposalType);
}

export function useSetProposalType(): (proposalType: string) => void {
  const dispatch = useDispatch<AppDispatch>();

  return React.useCallback(
    proposalType => {
      dispatch(setProposalType(proposalType));
    },
    [dispatch],
  );
}
