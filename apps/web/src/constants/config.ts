import { SupportedChainId as NetworkId } from '@balancednetwork/balanced-js';

export const NETWORK_ID: NetworkId = parseInt(import.meta.env.VITE_NETWORK_ID ?? '1');
