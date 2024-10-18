import { XPublicClient } from '@/xwagmi/core/XPublicClient';
import { XChainId, XToken } from '@/xwagmi/types';
import { TransactionStatus, XCallEvent } from '../../xcall/types';
import { SolanaXService } from './SolanaXService';

export class SolanaXPublicClient extends XPublicClient {
  getXService(): SolanaXService {
    return SolanaXService.getInstance();
  }

  getPublicClient(): any {}

  // TODO implement this
  async getBalance(address: string | undefined, xToken: XToken) {
    return undefined;
  }

  // TODO: implement this using suiClient.getAllBalances
  // async getBalances(address: string | undefined, xTokens: XToken[]) {
  // }

  // TODO implement this
  async getXCallFee(xChainId: XChainId, nid: XChainId, rollback: boolean, sources?: string[]) {
    return 0n;
  }

  // TODO implement this
  async getTxReceipt(txHash: string) {
    throw new Error('Method not implemented.');
  }

  // TODO implement this
  deriveTxStatus(rawTx): TransactionStatus {
    throw new Error('Method not implemented.');
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////////
  async getBlockHeight() {
    return BigInt(0); // not used
  }

  getTxEventLogs(rawTx) {
    return []; // not used
  }

  async getEventLogs(
    xChainId: XChainId,
    { startBlockHeight, endBlockHeight }: { startBlockHeight: bigint; endBlockHeight: bigint },
  ) {
    return []; // not used
  }

  parseEventLogs(eventLogs: any[]): XCallEvent[] {
    return []; // not used
  }
}
