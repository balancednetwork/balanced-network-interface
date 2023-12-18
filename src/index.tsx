import 'react-app-polyfill/ie11';
import 'react-app-polyfill/stable';

import * as React from 'react';

import BigNumber from 'bignumber.js';
import { IconReactProvider } from 'packages/icon-react';
import * as ReactDOM from 'react-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import * as serviceWorker from 'serviceWorker';

// Use consistent styling
import 'sanitize.css/sanitize.css';

// Import root app
import { App } from 'app';
import { ArchwayProvider } from 'app/_xcall/archway/ArchwayProvider';
import store from 'store';

// Initialize languages
import { LanguageProvider } from './i18n';

const MOUNT_NODE = document.getElementById('root') as HTMLElement;

const queryClient = new QueryClient();
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
    <BrowserRouter>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <IconReactProvider>
            <ArchwayProvider>
              <LanguageProvider>
                <React.StrictMode>
                  <App />
                </React.StrictMode>
              </LanguageProvider>
            </ArchwayProvider>
          </IconReactProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </BrowserRouter>
  </Provider>,
  MOUNT_NODE,
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
