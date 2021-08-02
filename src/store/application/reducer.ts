import { createReducer, nanoid } from '@reduxjs/toolkit';

import { DEFAULT_SLIPPAGE } from 'constants/index';

import {
  addPopup,
  PopupContent,
  removePopup,
  ApplicationModal,
  setOpenModal,
  changeShouldLedgedSignMessage,
  updateSlippageTolerance,
} from './actions';

type PopupList = Array<{ key: string; show: boolean; content: PopupContent; removeAfterMs: number | null }>;

export interface ApplicationState {
  readonly popupList: PopupList;
  readonly openModal: ApplicationModal | null;
  account: string;
  shouldLedgerSign: boolean;
  slippageTolerance: number;
}

const initialState: ApplicationState = {
  popupList: [],
  openModal: null,
  account: '',
  shouldLedgerSign: false,
  slippageTolerance: DEFAULT_SLIPPAGE,
};

export default createReducer(initialState, builder =>
  builder
    .addCase(addPopup, (state, { payload: { content, key, removeAfterMs = 15000 } }) => {
      state.popupList = (key ? state.popupList.filter(popup => popup.key !== key) : state.popupList).concat([
        {
          key: key || nanoid(),
          show: true,
          content,
          removeAfterMs,
        },
      ]);
    })
    .addCase(removePopup, (state, { payload: { key } }) => {
      state.popupList.forEach(p => {
        if (p.key === key) {
          p.show = false;
        }
      });
    })
    .addCase(setOpenModal, (state, action) => {
      state.openModal = action.payload;
    })
    .addCase(changeShouldLedgedSignMessage, (state, action) => {
      state.shouldLedgerSign = action.payload.shouldLedgerSign;
    })
    .addCase(updateSlippageTolerance, (state, action) => {
      state.slippageTolerance = action.payload.slippageTolerance;
    }),
);
