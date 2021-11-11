import { SupportedChainId as NetworkId } from 'packages/BalancedJs';

export const NETWORK_ID: NetworkId = parseInt(process.env.REACT_APP_NETWORK_ID ?? '1');
