import { fetchAPI } from 'btp/src/utils/fetch';

const app = {
  state: {
    appInfo: {
      content: {
        minted: [],
      },
    },
  },
  reducers: {
    setAppState(state, prop = []) {
      const [property, payload] = prop;
      return {
        ...state,
        [property]: payload,
      };
    },
  },
  effects: dispatch => ({
    async getAppInfo() {
      try {
        const appInfo = await fetchAPI('/btpnetwork?mintLast24h=true&volumeLast24h=true');
        this.setAppState(['appInfo', appInfo || {}]);
        return appInfo;
      } catch (error) {
        dispatch.modal.handleError(error);
      }
    },
  }),
  selectors: slice => ({
    selectAppInfo() {
      return slice(state => state.appInfo);
    },
    selectValueMint() {
      return slice(state => {
        return state.appInfo?.content?.minted.reduce((accumulator, { mintedVolume }) => accumulator + mintedVolume, 0);
      });
    },
  }),
};

export default app;
