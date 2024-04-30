import { IXCallFee, XChainId } from 'app/_xcall/types';
import { BridgeInfo, BridgeTransfer, XCallEventMap } from '../_zustand/types';

export interface XCallService {
  fetchXCallFee(to: XChainId, rollback: boolean): Promise<IXCallFee>;
  fetchBlockHeight(): Promise<number>;
  fetchSourceEvents(transfer: BridgeTransfer): Promise<XCallEventMap>;
  fetchDestinationEvents(transfer: BridgeTransfer): Promise<XCallEventMap>;
  executeTransfer(bridgeInfo: BridgeInfo): Promise<BridgeTransfer | null>;
}
