import { getConnectedNetworks, getNetwork } from 'btp/src/services/btpServices';

const network = {
  state: {
    networks: [],
    networkDetails: [],
  },
  reducers: {
    setNetworkState(state, prop = []) {
      const [property, payload] = prop;
      return {
        ...state,
        [property]: payload,
      };
    },
  },
  effects: dispatch => ({
    async getNetworks(params = {}, globalState) {
      const hasData = globalState.network.networks.length > 0;
      const { cache = false } = params;

      if (!cache || (cache && !hasData)) {
        try {
          const networks = await getConnectedNetworks();
          this.setNetworkState(['networks', networks.content.networks || []]);
          return networks;
        } catch (error) {
          dispatch.modal.handleError(error);
        }
      }
    },
    async getNetworkDetails(id) {
      try {
        const network = await getNetwork(id);
        this.setNetworkState(['networkDetails', network.content.tokens]);
        return network;
      } catch (error) {
        dispatch.modal.handleError(error);
      }
    },
  }),
  selectors: slice => ({
    selectNetwotks() {
      return slice(state => state.networks);
    },
    selectNetworkDetails() {
      return slice(state => state.networkDetails);
    },
  }),
};

export default network;
