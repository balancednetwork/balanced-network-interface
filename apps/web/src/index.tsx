import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import { App } from '@/app';
import store from '@/store';
import { XWagmiProviders } from '@balancednetwork/xwagmi';
import { LanguageProvider } from './i18n';
import { PlausibleProvider } from './providers/PlausibleProvider';
import { initSentry, logError, logMessage } from './sentry';
import sodaxConfig from './lib/sodax';
import { SodaxProvider } from '@sodax/dapp-kit';

// Initialize Sentry
initSentry();

// Use consistent styling
import 'sanitize.css/sanitize.css';

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

BigInt.prototype['toJSON'] = function () {
  return 'BIGINT::' + this.toString();
};
BigNumber.config({ FORMAT: fmt, ROUNDING_MODE: BigNumber.ROUND_DOWN });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <HelmetProvider>
          <SodaxProvider testnet={false} config={sodaxConfig}>
            <QueryClientProvider client={queryClient}>
              <XWagmiProviders>
                <LanguageProvider>
                  <PlausibleProvider domain="app.balanced.network">
                    <App />
                  </PlausibleProvider>
                </LanguageProvider>
              </XWagmiProviders>
            </QueryClientProvider>
          </SodaxProvider>
        </HelmetProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
// serviceWorker.unregister();
