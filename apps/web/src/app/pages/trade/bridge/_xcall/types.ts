import { IXCallFee, XChainId, XCallEventType } from 'app/pages/trade/bridge/types';
import { XTransactionInput, Transaction, TransactionStatus, XCallEvent, XCallEventMap } from '../_zustand/types';

export interface IPublicXService {
  // getBlock(blockHeight);
  getXCallFee(to: XChainId, rollback: boolean): Promise<IXCallFee>;
  getBlockHeight(): Promise<bigint>;
  getTxReceipt(txHash): Promise<any>;
  getTxEventLogs(rawTx): any[];
  deriveTxStatus(rawTx): TransactionStatus;

  getScanBlockCount(): bigint;
  getEventLogs({
    startBlockHeight,
    endBlockHeight,
  }: { startBlockHeight: bigint; endBlockHeight: bigint }): Promise<any[]>;
  parseEventLogs(eventLogs: any[]): XCallEvent[];
  filterEventLogs(eventLogs: XCallEvent[], xCallEventType: XCallEventType): any[];
  getSourceEvents(transaction: Transaction): Promise<XCallEventMap>;
  getDestinationEvents({ startBlockHeight, endBlockHeight }): Promise<XCallEvent[] | null>;
}

export abstract class AbstractPublicXService implements IPublicXService {
  abstract getXCallFee(to: XChainId, rollback: boolean): Promise<IXCallFee>;
  abstract getBlockHeight(): Promise<bigint>;
  abstract getTxReceipt(txHash): Promise<any>;
  abstract getTxEventLogs(rawTx): any[];
  abstract deriveTxStatus(rawTx): TransactionStatus;

  abstract getEventLogs({
    startBlockHeight,
    endBlockHeight,
  }: { startBlockHeight: bigint; endBlockHeight: bigint }): Promise<any[]>;
  abstract parseEventLogs(eventLogs: any[]): XCallEvent[];

  getScanBlockCount() {
    return 10n;
  }

  filterEventLogs(eventLogs: XCallEvent[], xCallEventType: XCallEventType) {
    return eventLogs.filter(x => x.eventType === xCallEventType);
  }

  async getSourceEvents(sourceTransaction: Transaction) {
    try {
      const events = this.parseEventLogs(sourceTransaction.rawEventLogs || []);
      return {
        [XCallEventType.CallMessageSent]: this.filterEventLogs(events, XCallEventType.CallMessageSent)[0],
      };
    } catch (e) {
      console.error(e);
    }
    return {};
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
  executeTransfer(xTransactionInput: XTransactionInput): Promise<string | undefined>;
  executeSwap(xTransactionInput: XTransactionInput): Promise<string | undefined>;
}
