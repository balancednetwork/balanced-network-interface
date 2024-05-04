import { IXCallFee, XChainId } from 'app/_xcall/types';
import { BridgeInfo, BridgeTransfer, TransactionStatus, XCallEvent, XCallEventMap } from '../_zustand/types';

export interface XCallService {
  // getBlock(blockHeight);
  getTx(txHash): Promise<any>;
  deriveTxStatus(rawTx): TransactionStatus;
  // filterEventLog(eventLogs)
  // filterCallMessageEventLog(eventLogs)
  // filterCallExecutedEventLog(eventLogs)
  // filterCallMessageSentEventLog(eventLogs)
  // parseCallMessageSentEventLog(eventLog)
  // parseCallMessageEventLog(eventLog)
  // parseCallExecutedEventLog(eventLog)

  // updateServiceConfig(serviceConfig: any): void;

  fetchXCallFee(to: XChainId, rollback: boolean): Promise<IXCallFee>;
  fetchBlockHeight(): Promise<bigint>;
  fetchSourceEvents(transfer: BridgeTransfer): Promise<XCallEventMap>;
  fetchDestinationEventsByBlock(blockHeight): Promise<XCallEvent[]>;
  executeTransfer(bridgeInfo: BridgeInfo): Promise<BridgeTransfer | null>;
}
