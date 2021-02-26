import { createReducer, nanoid } from '@reduxjs/toolkit';

import { addPopup, PopupContent, removePopup } from './actions';

type PopupList = Array<{ key: string; show: boolean; content: PopupContent; removeAfterMs: number | null }>;

export interface ApplicationState {
  readonly popupList: PopupList;
}

const initialState: ApplicationState = {
  popupList: [],
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
    }),
);
