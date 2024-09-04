// import 'react-app-polyfill/ie11';
// import 'react-app-polyfill/stable';

import React from 'react';
import ReactDOM from 'react-dom/client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';
import { HelmetProvider } from 'react-helmet-async';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';

// Use consistent styling
import 'sanitize.css/sanitize.css';

// Import root app
import { App } from '@/app';
import store from '@/store';

// Initialize languages
import { LanguageProvider } from './i18n';

import { wagmiConfig } from '@/xwagmi/xchains/evm/wagmiConfig';
import { WagmiProvider } from 'wagmi';

BigInt.prototype['toJSON'] = function () {
  return 'BIGINT::' + this.toString();
};

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

const networks = {
  devnet: { url: getFullnodeUrl('devnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
};

BigNumber.config({ FORMAT: fmt, ROUNDING_MODE: BigNumber.ROUND_DOWN });
BigNumber.set({ ROUNDING_MODE: BigNumber.ROUND_DOWN }); // equivalent

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <HelmetProvider>
          <QueryClientProvider client={queryClient}>
            <WagmiProvider config={wagmiConfig}>
              <SuiClientProvider networks={networks} defaultNetwork="devnet">
                <WalletProvider>
                  <LanguageProvider>
                    <App />
                  </LanguageProvider>
                </WalletProvider>
              </SuiClientProvider>
            </WagmiProvider>
          </QueryClientProvider>
        </HelmetProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
// serviceWorker.unregister();
