import { IXCallFee, XChainId, XToken } from 'app/pages/trade/bridge-v2/types';
import {
  BridgeInfo,
  BridgeTransfer,
  Transaction,
  TransactionStatus,
  XCallEvent,
  XCallEventMap,
} from '../_zustand/types';

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

  // getAllowance(token: XToken, owner: string | null, spender: string): Promise<string>;
  approve(token, owner, spender, currencyAmountToApprove);

  fetchXCallFee(to: XChainId, rollback: boolean): Promise<IXCallFee>;
  fetchBlockHeight(): Promise<bigint>;
  fetchSourceEvents(transfer: BridgeTransfer): Promise<XCallEventMap>;
  fetchDestinationEventsByBlock(blockHeight: bigint): Promise<XCallEvent[]>;
  executeTransfer(bridgeInfo: BridgeInfo): Promise<string | undefined>;
}
