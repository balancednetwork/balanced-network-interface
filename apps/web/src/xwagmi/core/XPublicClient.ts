import {
  Transaction,
  TransactionStatus,
  XCallEvent,
  XCallEventType,
  XCallMessageSentEvent,
} from '@/xwagmi/xcall/types';
import { XChainId } from '../types';

export interface IXPublicClient {
  // getBlock(blockHeight);
  getXCallFee(xChainId: XChainId, nid: XChainId, rollback: boolean, sources?: string[]): Promise<bigint>;
  getBlockHeight(): Promise<bigint>;
  getTxReceipt(txHash): Promise<any>;
  getTxEventLogs(rawTx): any[];
  deriveTxStatus(rawTx): TransactionStatus;

  getPublicClient(): any;

  getScanBlockCount(): bigint;
  getEventLogs(
    xChainId: XChainId,
    { startBlockHeight, endBlockHeight }: { startBlockHeight: bigint; endBlockHeight: bigint },
  ): Promise<any[]>;
  parseEventLogs(eventLogs: any[]): XCallEvent[];
  filterEventLogs(eventLogs: XCallEvent[], xCallEventType: XCallEventType): XCallEvent[];
  getCallMessageSentEvent(transaction: Transaction): XCallMessageSentEvent | null;
  getDestinationEvents(xChainId: XChainId, { startBlockHeight, endBlockHeight }): Promise<XCallEvent[] | null>;
}

export abstract class XPublicClient implements IXPublicClient {
  public xChainId: XChainId;

  constructor(xChainId: XChainId) {
    this.xChainId = xChainId;
  }

  abstract getXCallFee(xChainId: XChainId, nid: XChainId, rollback: boolean, sources?: string[]): Promise<bigint>;
  abstract getBlockHeight(): Promise<bigint>;
  abstract getTxReceipt(txHash): Promise<any>;
  abstract getTxEventLogs(rawTx): any[];
  abstract deriveTxStatus(rawTx): TransactionStatus;
  abstract getPublicClient();

  abstract getEventLogs(
    xChainId: XChainId,
    { startBlockHeight, endBlockHeight }: { startBlockHeight: bigint; endBlockHeight: bigint },
  ): Promise<any[]>;
  abstract parseEventLogs(eventLogs: any[]): XCallEvent[];

  getScanBlockCount() {
    return 30n;
  }

  filterEventLogs(eventLogs: XCallEvent[], xCallEventType: XCallEventType) {
    return eventLogs.filter(x => x.eventType === xCallEventType);
  }

  getCallMessageSentEvent(sourceTransaction: Transaction) {
    try {
      const events = this.parseEventLogs(sourceTransaction.rawEventLogs || []);
      const callMessageSentEvent = this.filterEventLogs(events, XCallEventType.CallMessageSent)[0];
      return callMessageSentEvent as XCallMessageSentEvent;
    } catch (e) {
      console.error(e);
    }
    return null;
  }

  async getDestinationEvents(
    xChainId: XChainId,
    { startBlockHeight, endBlockHeight }: { startBlockHeight: bigint; endBlockHeight: bigint },
  ) {
    try {
      const eventLogs = await this.getEventLogs(xChainId, { startBlockHeight, endBlockHeight });
      const parsedEventsLogs = this.parseEventLogs(eventLogs);
      const events = [XCallEventType.CallMessage, XCallEventType.CallExecuted].flatMap(eventType =>
        this.filterEventLogs(parsedEventsLogs, eventType),
      );

      return events;
    } catch (e) {
      console.log(e);
    }
    return null;
  }
}
