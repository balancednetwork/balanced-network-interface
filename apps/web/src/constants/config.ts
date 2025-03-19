import { SupportedChainId as NetworkId } from '@balancednetwork/balanced-js';

export const NETWORK_ID: NetworkId = parseInt(import.meta.env.VITE_NETWORK_ID ?? '1');
export const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
