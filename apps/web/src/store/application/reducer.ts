import { createSlice, nanoid } from '@reduxjs/toolkit';

import { DEFAULT_SLIPPAGE } from '@/constants/index';
import { DEFAULT_TXN_DISMISS_MS } from '@/constants/misc';

export type PopupContent = {
  txn: {
    hash: string;
    success: boolean;
    summary?: string;
  };
};

export enum ApplicationModal {
  WALLET,
  SETTINGS,
  SELF_CLAIM,
  ADDRESS_CLAIM,
  CLAIM_POPUP,
  MENU,
  DELEGATE,
  VOTE,
  BRIDGE_WALLET,
  TRANSFER_ASSETS,
}

type PopupList = Array<{ key: string; show: boolean; content: PopupContent; removeAfterMs: number | null }>;

export interface ApplicationState {
  blockNumber: { readonly [chainId: number]: number };
  chainId: number | null;
  popupList: PopupList;
  openModal: ApplicationModal | null;
  slippageTolerance: number;
}

const initialState: ApplicationState = {
  blockNumber: {},
  chainId: null,
  openModal: null,
  popupList: [],
  slippageTolerance: DEFAULT_SLIPPAGE,
};

const applicationSlice = createSlice({
  name: 'application',
  initialState,
  reducers: {
    updateChainId(state, action) {
      const { chainId } = action.payload;
      state.chainId = chainId;
    },
    updateBlockNumber(state, action) {
      const { chainId, blockNumber } = action.payload;
      if (typeof state.blockNumber[chainId] !== 'number') {
        state.blockNumber[chainId] = blockNumber;
      } else {
        state.blockNumber[chainId] = Math.max(blockNumber, state.blockNumber[chainId]);
      }
    },
    setOpenModal(state, action) {
      state.openModal = action.payload;
    },
    addPopup(state, { payload: { content, key, removeAfterMs = DEFAULT_TXN_DISMISS_MS } }) {
      state.popupList = (key ? state.popupList.filter(popup => popup.key !== key) : state.popupList).concat([
        {
          key: key || nanoid(),
          show: true,
          content,
          removeAfterMs,
        },
      ]);
    },
    removePopup(state, { payload: { key } }) {
      state.popupList.forEach(p => {
        if (p.key === key) {
          p.show = false;
        }
      });
    },
    updateSlippageTolerance(state, action) {
      state.slippageTolerance = action.payload.slippageTolerance;
    },
  },
});

export const { updateChainId, updateBlockNumber, setOpenModal, addPopup, removePopup, updateSlippageTolerance } =
  applicationSlice.actions;
export default applicationSlice.reducer;
