import { XChainId } from 'app/_xcall/types';
import { XCallService } from './types';

export class EvmXCallService implements XCallService {
  xChainId: XChainId;

  constructor(xChainId) {
    this.xChainId = xChainId;
  }
  fetchXCallFee(to, rollback) {
    return Promise.resolve();
  }
  fetchBlockHeight() {
    return Promise.resolve();
  }
  fetchSourceEvents(transfer) {
    return Promise.resolve();
  }
  fetchDestinationEvents() {
    return Promise.resolve();
  }
  executeTransfer(bridgeInfo) {
    return Promise.resolve();
  }
}
