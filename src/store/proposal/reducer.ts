import { createReducer } from '@reduxjs/toolkit';

import { PROPOSAL_CONFIG } from 'app/containers/NewProposalPage/constant';

import { setProposalType } from './actions';

export interface ProposalState {
  selectedProposalType: string;
}

const initialState: ProposalState = {
  selectedProposalType: Object.keys(PROPOSAL_CONFIG)[0],
};

export default createReducer(initialState, builder =>
  builder.addCase(setProposalType, (state, { payload }) => {
    state.selectedProposalType = payload;
  }),
);
