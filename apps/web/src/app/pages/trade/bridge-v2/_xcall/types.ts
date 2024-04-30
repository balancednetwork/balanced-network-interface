import { XChainId } from 'app/_xcall/types';

export interface XCallService {
  fetchXCallFee(to: XChainId, rollback: boolean): Promise<any>;
  fetchBlockHeight(): Promise<any>;
  fetchSourceEvents(transfer: any): Promise<any>;
  fetchDestinationEvents(): Promise<any>;
  executeTransfer(bridgeInfo: any): Promise<any>;
}
