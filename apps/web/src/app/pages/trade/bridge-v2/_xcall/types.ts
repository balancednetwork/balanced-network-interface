import { XChainId } from 'app/_xcall/types';
import { BridgeInfo, BridgeTransfer } from '../_zustand/types';

export interface XCallService {
  fetchXCallFee(to: XChainId, rollback: boolean): Promise<any>;
  fetchBlockHeight(): Promise<any>;
  fetchSourceEvents(transfer: BridgeTransfer): Promise<any>;
  fetchDestinationEvents(transfer: BridgeTransfer): Promise<any>;
  executeTransfer(bridgeInfo: BridgeInfo): Promise<any>;
}
