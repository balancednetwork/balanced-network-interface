import { Currency, CurrencyAmount } from '@balancednetwork/sdk-core';
import { IXCallFee, XCallEventType, XChainId } from 'app/_xcall/types';

export enum BridgeTransferStatus {
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
  hash: string;
  xChainId: number;
  status: TransactionStatus;
  receipt: any;
  redirectOnSuccess?: string; // URL to redirect on success
  pendingMessage: string;
  successMessage: string;
  errorMessage?: string;
};

export type XCallSourceEvent = {
  eventType: XCallEventType;
  sn: number;
  xChainId: XChainId;
  rawEventData: any;
};

export type XCallDestinationEvent = {
  eventType: XCallEventType;
  sn: number;
  reqId: number;
  xChainId: XChainId;
  rawEventData: any;
};

export type XCallEvent = XCallSourceEvent | XCallDestinationEvent;

export type XCallEventMap = Partial<Record<XCallEventType, XCallEvent>>;

export type BridgeTransfer = {
  id: string;
  bridgeInfo: BridgeInfo;
  transactions: Transaction[];
  events: XCallEventMap;
  status: BridgeTransferStatus;
  destinationChainInitialBlockHeight: number;
};
