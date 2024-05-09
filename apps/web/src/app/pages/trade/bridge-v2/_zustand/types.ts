import { Currency, CurrencyAmount } from '@balancednetwork/sdk-core';
import { IXCallFee, XCallEventType, XChainId } from 'app/pages/trade/bridge-v2/types';

export enum BridgeTransferStatus {
  TRANSFER_REQUESTED = 'TRANSFER_REQUESTED',
  TRANSFER_FAILED = 'TRANSFER_FAILED',
  // TRANSFER_COMPLETED = 'TRANSFER_COMPLETED',

  AWAITING_CALL_MESSAGE_SENT = 'AWAITING_CALL_MESSAGE_SENT',
  CALL_MESSAGE_SENT = 'CALL_MESSAGE_SENT',
  CALL_MESSAGE = 'CALL_MESSAGE',
  CALL_EXECUTED = 'CALL_EXECUTED',
}

export enum TransactionStatus {
  pending = 'pending',
  success = 'success',
  failure = 'failure',
}

export type BridgeInfo = {
  bridgeDirection: {
    from: XChainId;
    to: XChainId;
  };
  currencyAmountToBridge: CurrencyAmount<Currency>;
  recipient: string;
  account: string;
  xCallFee: IXCallFee;
  isLiquidFinanceEnabled?: boolean;
  isDenom?: boolean;
};

export type Transaction = {
  id: string;
  hash: string;
  xChainId: number;
  status: TransactionStatus;

  pendingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
  redirectOnSuccess?: string; // URL to redirect on success
  onSuccess?: () => void; // Callback on success

  rawTx?: any;
};

export type XCallSourceEvent = {
  eventType: XCallEventType;
  sn: bigint;
  xChainId: XChainId;
  rawEventData: any;
};

export type XCallDestinationEvent = {
  eventType: XCallEventType;
  sn: bigint;
  reqId: bigint;
  xChainId: XChainId;
  rawEventData: any;
};

export type XCallEvent = XCallSourceEvent | XCallDestinationEvent;

export type XCallEventMap = Partial<Record<XCallEventType, XCallEvent>>;

export type BridgeTransfer = {
  id: string;
  sourceChainId: XChainId;
  destinationChainId: XChainId;
  // bridgeInfo: BridgeInfo;
  sourceTransaction: Transaction;
  events: XCallEventMap;
  status: BridgeTransferStatus;
  destinationChainInitialBlockHeight: bigint;
};
