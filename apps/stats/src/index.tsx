import * as React from 'react';
import ReactDOM from 'react-dom/client';

import BigNumber from 'bignumber.js';
import { HelmetProvider } from 'react-helmet-async';

// Use consistent styling
import 'sanitize.css/sanitize.css';

// Import root app

import { App } from './App';

const MOUNT_NODE = document.getElementById('root') as HTMLElement;

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

BigInt.prototype['toJSON'] = function () {
  return 'BIGINT::' + this.toString();
};

ReactDOM.createRoot(MOUNT_NODE).render(
  <HelmetProvider>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </HelmetProvider>,
);
