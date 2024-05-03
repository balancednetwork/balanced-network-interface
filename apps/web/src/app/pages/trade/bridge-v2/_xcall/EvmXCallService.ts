import { XChainId } from 'app/_xcall/types';
import { XCallService } from './types';
import { BridgeInfo, BridgeTransfer } from '../_zustand/types';

export class EvmXCallService implements XCallService {
  xChainId: XChainId;
  publicClient: any;
  walletClient: any;

  constructor(xChainId: XChainId, serviceConfig: any) {
    const { publicClient, walletClient } = serviceConfig;
    this.xChainId = xChainId;
    this.publicClient = publicClient;
    this.walletClient = walletClient;
  }

  fetchXCallFee(to: XChainId, rollback: boolean) {
    return Promise.resolve({
      rollback: '0',
      noRollback: '0',
    });
  }

  async fetchBlockHeight() {
    const blockNumber = await this.publicClient.getBlockNumber();
    console.log('blockNumber', blockNumber);
    return blockNumber;
  }
  fetchSourceEvents(transfer: BridgeTransfer) {
    return Promise.resolve({});
  }

  fetchDestinationEventsByBlock(blockHeight) {
    return Promise.resolve([]);
  }

  executeTransfer(bridgeInfo: BridgeInfo) {
    return Promise.resolve(null);
  }
}
