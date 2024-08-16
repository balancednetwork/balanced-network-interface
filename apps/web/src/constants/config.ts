import { SupportedChainId as NetworkId } from '@balancednetwork/balanced-js';
import { XChainId } from '@/types';

export const NETWORK_ID: NetworkId = parseInt(process.env.REACT_APP_NETWORK_ID ?? '1');

export const ICON_XCALL_NETWORK_ID: XChainId = '0x1.icon';
