import { XChainId } from 'app/_xcall/types';
import { XCallService } from './types';
import { BridgeInfo, BridgeTransfer } from '../_zustand/types';

export class EvmXCallService implements XCallService {
  xChainId: XChainId;

  constructor(xChainId) {
    this.xChainId = xChainId;
  }
  fetchXCallFee(to: XChainId, rollback: boolean) {
    return Promise.resolve();
  }
  fetchBlockHeight() {
    return Promise.resolve();
  }
  fetchSourceEvents(transfer: BridgeTransfer) {
    return Promise.resolve();
  }
  fetchDestinationEvents(transfer: BridgeTransfer) {
    return Promise.resolve();
  }
  executeTransfer(bridgeInfo: BridgeInfo) {
    return Promise.resolve();
  }
}
