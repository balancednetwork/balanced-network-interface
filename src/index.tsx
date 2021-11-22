import 'react-app-polyfill/ie11';
import 'react-app-polyfill/stable';

import * as React from 'react';

import BigNumber from 'bignumber.js';
import * as ReactDOM from 'react-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Provider } from 'react-redux';
import * as serviceWorker from 'serviceWorker';

// Use consistent styling
import 'sanitize.css/sanitize.css';

// Import root app
import { App } from 'app';
import store from 'store';

// Initialize languages
import './locales/i18n';

const MOUNT_NODE = document.getElementById('root') as HTMLElement;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});
// Set the global formatting options
const fmt = {
  prefix: '',
  decimalSeparator: '.',
  groupSeparator: ',',
  groupSize: 3,
  secondaryGroupSize: 0,
  fractionGroupSeparator: ' ',
  fractionGroupSize: 0,
  suffix: '',
};

BigNumber.config({ FORMAT: fmt, ROUNDING_MODE: BigNumber.ROUND_DOWN });
BigNumber.set({ ROUNDING_MODE: BigNumber.ROUND_DOWN }); // equivalent

ReactDOM.render(
  <Provider store={store}>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <React.StrictMode>
          <App />
        </React.StrictMode>
      </QueryClientProvider>
    </HelmetProvider>
  </Provider>,
  MOUNT_NODE,
);

// Hot reloadable translation json files
if (module.hot) {
  module.hot.accept(['./locales/i18n'], () => {
    // No need to render the App again because i18next works with the hooks
  });
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
