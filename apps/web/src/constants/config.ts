import { SupportedChainId as NetworkId } from '@balancednetwork/balanced-js';

export const NETWORK_ID: NetworkId = parseInt(process.env.REACT_APP_NETWORK_ID ?? '1');
