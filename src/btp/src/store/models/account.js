import { ADDRESS_LOCAL_STORAGE, CONNECTED_WALLET_LOCAL_STORAGE } from '../../connectors/constants';
import { roundNumber } from '../../utils/app';

const initState = {
  symbol: '',
  wallet: '',
  address: '',
  balance: 0,
  cancelConfirmation: false,
  currentNetwork: '',
};

const account = {
  name: 'account',
  state: {
    ...initState,
  },
  reducers: {
    setAccountInfo(state, payload) {
      return {
        ...state,
        ...payload,
      };
    },
    resetAccountInfo() {
      localStorage.removeItem(ADDRESS_LOCAL_STORAGE);
      localStorage.removeItem(CONNECTED_WALLET_LOCAL_STORAGE);
      return initState;
    },
  },
  effects: () => ({}),
  selectors: slice => ({
    selectAccountInfo() {
      return slice(state => ({
        ...state,
        balance: roundNumber(state.balance, 4),
      }));
    },
    selectIsConnected() {
      return slice(state => !!state.address);
    },
  }),
};

export default account;
