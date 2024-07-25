import { XChainId, XCallEventType } from 'app/pages/trade/bridge/types';
import {
  XTransactionInput,
  Transaction,
  TransactionStatus,
  XCallEvent,
  XCallMessageSentEvent,
} from '../_zustand/types';

export interface IPublicXService {
  // getBlock(blockHeight);
  getXCallFee(nid: XChainId, rollback: boolean, sources?: string[]): Promise<bigint>;
  getBlockHeight(): Promise<bigint>;
  getTxReceipt(txHash): Promise<any>;
  getTxEventLogs(rawTx): any[];
  deriveTxStatus(rawTx): TransactionStatus;

  getPublicClient(): any;

  getScanBlockCount(): bigint;
  getEventLogs({
    startBlockHeight,
    endBlockHeight,
  }: { startBlockHeight: bigint; endBlockHeight: bigint }): Promise<any[]>;
  parseEventLogs(eventLogs: any[]): XCallEvent[];
  filterEventLogs(eventLogs: XCallEvent[], xCallEventType: XCallEventType): XCallEvent[];
  getCallMessageSentEvent(transaction: Transaction): XCallMessageSentEvent | null;
  getDestinationEvents({ startBlockHeight, endBlockHeight }): Promise<XCallEvent[] | null>;
}

export abstract class AbstractPublicXService implements IPublicXService {
  abstract getXCallFee(nid: XChainId, rollback: boolean): Promise<bigint>;
  abstract getBlockHeight(): Promise<bigint>;
  abstract getTxReceipt(txHash): Promise<any>;
  abstract getTxEventLogs(rawTx): any[];
  abstract deriveTxStatus(rawTx): TransactionStatus;
  abstract getPublicClient();

  abstract getEventLogs({
    startBlockHeight,
    endBlockHeight,
  }: { startBlockHeight: bigint; endBlockHeight: bigint }): Promise<any[]>;
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

  async getDestinationEvents({
    startBlockHeight,
    endBlockHeight,
  }: { startBlockHeight: bigint; endBlockHeight: bigint }) {
    try {
      const eventLogs = await this.getEventLogs({ startBlockHeight, endBlockHeight });
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

export interface IWalletXService extends IPublicXService {
  // getAllowance(token: XToken, owner: string | null, spender: string): Promise<string>;
  approve(token, owner, spender, currencyAmountToApprove);
  executeTransaction(xTransactionInput: XTransactionInput): Promise<string | undefined>;
}

export type ICONTxEvent = {
  indexed: string[];
  data: string[];
  scoreAddress: string;
};

export type ICONTxResultType = {
  status: number; // 1 = success, 0 = failure
  blockHash: string;
  blockHeight: number;
  txHash: string;
  eventLogs: ICONTxEvent[];
};
