import { getRelays, getTotalRewardFund, getRelayCandidates } from 'services/btpServices';

const governance = {
  state: {
    relays: {
      content: [],
      total: 0,
      registeredLastChange24h: 0,
    },
    relayCandidates: [],
    totalRewardFund: {
      totalAmount: 0,
      last30DaysChange: 0,
    },
  },
  reducers: {
    setGovernanceState(state, prop = []) {
      const [property, payload] = prop;
      return {
        ...state,
        [property]: payload,
      };
    },
  },
  effects: dispatch => ({
    async getRelays({ page, limit }) {
      try {
        const relays = await getRelays(page, limit);
        this.setGovernanceState(['relays', relays || {}]);
        return relays;
      } catch (error) {
        dispatch.modal.handleError(error);
      }
    },
    async getRelayCandidates({ page, limit }) {
      try {
        const relayCandidates = (await getRelayCandidates(page, limit)).content;
        this.setGovernanceState(['relayCandidates', relayCandidates || []]);
        return relayCandidates;
      } catch (error) {
        dispatch.modal.handleError(error);
      }
    },
    async getTotalRewardFund() {
      try {
        const totalRewardFund = await getTotalRewardFund();
        const { totalAmount, last30DaysChange } = totalRewardFund.content;
        this.setGovernanceState([
          'totalRewardFund',
          {
            totalAmount,
            last30DaysChange,
          },
        ]);
        return totalRewardFund;
      } catch (error) {
        dispatch.modal.handleError(error);
      }
    },
  }),
  selectors: slice => ({
    selectRelays() {
      return slice(state => state.relays);
    },
    selectRelayCandidates() {
      return slice(state => state.relayCandidates);
    },
    selectTotalRewardFund() {
      return slice(state => state.totalRewardFund);
    },
  }),
};

export default governance;
