import { BalancedJs } from '@balancednetwork/balanced-js';

const bnJs = new BalancedJs({ networkId: parseInt(process.env.REACT_APP_NETWORK_ID ?? '1') });

export default bnJs;
