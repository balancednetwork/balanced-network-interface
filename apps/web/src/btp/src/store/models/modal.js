import { wallets } from 'btp/src/utils/constants';

const modal = {
  name: 'modal',
  state: {
    display: false,
    options: {},
  },
  reducers: {
    setDisplay(state, display) {
      return {
        ...state,
        display,
      };
    },
    openModal(state, payload = {}) {
      return {
        ...state,
        options: {
          ...payload,
        },
        display: true,
      };
    },
  },
  effects: () => ({
    handleError(error) {
      console.log('error', error);
      this.openModal({
        icon: 'xIcon',
        desc: (error && error.message) || error || 'Something went wrong!',
      });
    },
    isICONexWalletConnected(_, rootState) {
      const {
        account: { wallet },
      } = rootState;

      if (![wallets.iconex, wallets.hana].includes(wallet)) {
        this.openModal({
          icon: 'exclamationPointIcon',
          desc: 'You must connect to your ICONex/Hana wallet first',
          button: {
            text: 'Okay',
            onClick: () => this.setDisplay(false),
          },
        });
        return false;
      }
      return true;
    },
  }),

  selectors: slice => ({
    selectDisplay() {
      return slice(state => state.display);
    },
    selectOptions() {
      return slice(state => state.options);
    },
  }),
};

export default modal;
