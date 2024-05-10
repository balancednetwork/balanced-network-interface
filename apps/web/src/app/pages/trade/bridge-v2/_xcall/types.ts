import { IXCallFee, XChainId, XToken } from 'app/pages/trade/bridge-v2/types';
import { BridgeInfo, Transaction, TransactionStatus, XCallEvent, XCallEventMap } from '../_zustand/types';

export interface XCallService {
  // getBlock(blockHeight);
  getTxReceipt(txHash): Promise<any>;
  deriveTxStatus(rawTx): TransactionStatus;
  // filterEventLog(eventLogs)
  // filterCallMessageEventLog(eventLogs)
  // filterCallExecutedEventLog(eventLogs)
  // filterCallMessageSentEventLog(eventLogs)
  // parseCallMessageSentEventLog(eventLog)
  // parseCallMessageEventLog(eventLog)
  // parseCallExecutedEventLog(eventLog)

  // updateServiceConfig(serviceConfig: any): void;

  // getAllowance(token: XToken, owner: string | null, spender: string): Promise<string>;
  approve(token, owner, spender, currencyAmountToApprove);

  getXCallFee(to: XChainId, rollback: boolean): Promise<IXCallFee>;
  getBlockHeight(): Promise<bigint>;
  getSourceEvents(transaction: Transaction): Promise<XCallEventMap>;
  getDestinationEventsByBlock(blockHeight: bigint): Promise<XCallEvent[]>;
  executeTransfer(bridgeInfo: BridgeInfo): Promise<string | undefined>;
  executeSwap(swapInfo: any): Promise<string | undefined>;
}
