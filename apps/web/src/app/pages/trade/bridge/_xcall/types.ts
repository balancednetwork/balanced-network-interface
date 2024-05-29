import { IXCallFee, XChainId, XToken } from 'app/pages/trade/bridge/types';
import { XTransactionInput, Transaction, TransactionStatus, XCallEvent, XCallEventMap } from '../_zustand/types';

export interface XCallService {
  // getBlock(blockHeight);
  // filterEventLogs(eventLogs)
  // filterCallMessageEventLogs(eventLogs)
  // filterCallExecutedEventLogs(eventLogs)
  // filterCallMessageSentEventLog(eventLogs)
  // parseCallMessageEventLog(eventLog)
  // parseCallExecutedEventLog(eventLog)
  // parseCallMessageSentEventLog(eventLog)

  // updateServiceConfig(serviceConfig: any): void;

  getXCallFee(to: XChainId, rollback: boolean): Promise<IXCallFee>;
  getBlockHeight(): Promise<bigint>;
  getBlockEventLogs(blockHeight: bigint): Promise<any[]>;
  getTxReceipt(txHash): Promise<any>;
  getTxEventLogs(rawTx): any[];
  deriveTxStatus(rawTx): TransactionStatus;

  getScanBlockCount(): bigint;
  getSourceEvents(transaction: Transaction): Promise<XCallEventMap>;
  getDestinationEvents({ startBlockHeight, endBlockHeight }): Promise<XCallEvent[]>;
  getDestinationEventsByBlock(blockHeight: bigint): Promise<XCallEvent[]>;

  // getAllowance(token: XToken, owner: string | null, spender: string): Promise<string>;
  approve(token, owner, spender, currencyAmountToApprove);

  executeTransfer(xSwapInfo: XTransactionInput): Promise<string | undefined>;
  executeSwap(xSwapInfo: XTransactionInput): Promise<string | undefined>;
}
