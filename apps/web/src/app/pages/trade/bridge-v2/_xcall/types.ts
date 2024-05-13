import { IXCallFee, XChainId, XToken } from 'app/pages/trade/bridge-v2/types';
import { BridgeInfo, SwapInfo, Transaction, TransactionStatus, XCallEvent, XCallEventMap } from '../_zustand/types';

export interface XCallService {
  // getBlock(blockHeight);
  // filterEventLog(eventLogs)
  // filterCallMessageEventLog(eventLogs)
  // filterCallExecutedEventLog(eventLogs)
  // filterCallMessageSentEventLog(eventLogs)
  // parseCallMessageSentEventLog(eventLog)
  // parseCallMessageEventLog(eventLog)
  // parseCallExecutedEventLog(eventLog)

  // updateServiceConfig(serviceConfig: any): void;

  getXCallFee(to: XChainId, rollback: boolean): Promise<IXCallFee>;
  getBlockHeight(): Promise<bigint>;
  getEventLogs(blockHeight: bigint): Promise<any[]>;
  getTxReceipt(txHash): Promise<any>;
  deriveTxStatus(rawTx): TransactionStatus;

  getSourceEvents(transaction: Transaction): Promise<XCallEventMap>;
  getDestinationEventsByBlock(blockHeight: bigint): Promise<XCallEvent[]>;

  // getAllowance(token: XToken, owner: string | null, spender: string): Promise<string>;
  approve(token, owner, spender, currencyAmountToApprove);

  executeTransfer(bridgeInfo: BridgeInfo): Promise<string | undefined>;
  executeSwap(swapInfo: SwapInfo): Promise<string | undefined>;
}
