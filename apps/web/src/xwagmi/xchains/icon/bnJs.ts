import { BalancedJs } from '@balancednetwork/balanced-js';

const bnJs = new BalancedJs({ networkId: parseInt(import.meta.env.VITE_NETWORK_ID ?? '1') });

export default bnJs;
