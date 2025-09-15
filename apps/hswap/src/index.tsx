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
import './index.css';

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
BigNumber.set({ ROUNDING_MODE: BigNumber.ROUND_DOWN }); // equivalent

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <HelmetProvider>
          <QueryClientProvider client={queryClient}>
            <XWagmiProviders>
              <LanguageProvider>
                <App />
              </LanguageProvider>
            </XWagmiProviders>
          </QueryClientProvider>
        </HelmetProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);
