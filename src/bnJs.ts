import { BalancedJs } from 'packages/BalancedJs';

const bnJs = new BalancedJs({ networkId: parseInt(process.env.REACT_APP_NETWORK_ID ?? '1') });

export default bnJs;
