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
  filterEventLogs(eventLogs, xCallEventType: XCallEventType): any[];
  parseEventLog(eventLog: any, txHash: string, eventType: XCallEventType): XCallEvent;
  getSourceEvents(transaction: Transaction): Promise<XCallEventMap>;
  getDestinationEvents({ startBlockHeight, endBlockHeight }): Promise<XCallEvent[]>;
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
  abstract filterEventLogs(eventLogs, xCallEventType: XCallEventType): any[];
  abstract parseEventLog(eventLog: any, txHash: string, eventType: XCallEventType): XCallEvent;

  getScanBlockCount() {
    return 10n;
  }

  async getSourceEvents(sourceTransaction: Transaction) {
    try {
      const callMessageSentEventLog = this.filterEventLogs(
        sourceTransaction.rawEventLogs,
        XCallEventType.CallMessageSent,
      )[0];
      return {
        [XCallEventType.CallMessageSent]: this.parseEventLog(
          callMessageSentEventLog,
          sourceTransaction.hash,
          XCallEventType.CallMessageSent,
        ),
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
      const events: any = [];

      const eventLogs = await this.getEventLogs({ startBlockHeight, endBlockHeight });
      [XCallEventType.CallMessage, XCallEventType.CallExecuted].forEach(eventType => {
        const parsedEventLogs = this.filterEventLogs(eventLogs, eventType).map(eventLog =>
          this.parseEventLog(eventLog, eventLog.transactionHash, eventType),
        );
        events.push(...parsedEventLogs);
      });

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
