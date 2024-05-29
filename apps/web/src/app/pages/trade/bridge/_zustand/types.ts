import { Currency, CurrencyAmount, TradeType } from '@balancednetwork/sdk-core';
import { Trade } from '@balancednetwork/v1-sdk';
import { IXCallFee, XCallEventType, XChainId } from 'app/pages/trade/bridge/types';

export enum TransactionStatus {
  pending = 'pending',
  success = 'success',
  failure = 'failure',
}

export enum XCallTransactionStatus {
  pending = 'pending',
  success = 'success',
  failure = 'failure',
}

export enum XCallTransactionType {
  SWAP = 'swap',
  BRIDGE = 'bridge',
  SUPPLY = 'supply',
}

export enum XMessageStatus {
  REQUESTED = 'REQUESTED',
  FAILED = 'FAILED',
  // COMPLETED = 'COMPLETED',

  AWAITING_CALL_MESSAGE_SENT = 'AWAITING_CALL_MESSAGE_SENT',
  CALL_MESSAGE_SENT = 'CALL_MESSAGE_SENT',
  CALL_MESSAGE = 'CALL_MESSAGE',
  CALL_EXECUTED = 'CALL_EXECUTED',
}

export type XSwapInfo = {
  direction: {
    from: XChainId;
    to: XChainId;
  };
  type: XCallTransactionType;
  inputAmount: CurrencyAmount<Currency>;
  account: string;
  recipient: string;
  xCallFee: IXCallFee;
  // xswap
  executionTrade?: Trade<Currency, Currency, TradeType>;
  slippageTolerance?: number;
  isLiquidFinanceEnabled?: boolean;
};

export type Transaction = {
  id: string;
  hash: string;
  xChainId: XChainId;
  status: TransactionStatus;
  timestamp: number;

  pendingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
  redirectOnSuccess?: string; // URL to redirect on success
  onSuccess?: () => void; // Callback on success

  rawEventLogs?: any[];
};

export type XCallSourceEvent = {
  eventType: XCallEventType;
  sn: bigint;
  xChainId: XChainId;
  rawEventData: any;
  txHash: string;
};

export type XCallDestinationEvent = {
  eventType: XCallEventType;
  sn: bigint;
  reqId: bigint;
  xChainId: XChainId;
  rawEventData: any;
  txHash: string;
  isSuccess: boolean;
};

export type XCallEvent = XCallSourceEvent | XCallDestinationEvent;

export type XCallEventMap = Partial<{
  [XCallEventType.CallMessageSent]: XCallSourceEvent;
  [XCallEventType.CallMessage]: XCallDestinationEvent;
  [XCallEventType.CallExecuted]: XCallDestinationEvent;
}>;

export type XMessage = {
  id: string;
  sourceChainId: XChainId;
  destinationChainId: XChainId;
  sourceTransaction: Transaction;
  destinationTransaction?: Transaction;
  events: XCallEventMap;
  status: XMessageStatus;
  destinationChainInitialBlockHeight: bigint;
  // onSuccess: (xMessage: XMessage) => Promise<void>;
  // onFail: (xMessage: XMessage) => Promise<void>;
};

export type XCallTransaction = {
  id: string;
  type: XCallTransactionType;
  status: XCallTransactionStatus;

  primaryMessageId: string;
  secondaryMessageId?: string;
  secondaryMessageRequired: boolean;

  sourceChainId: XChainId;
  desctinationChainId: XChainId;
  destinationChainInitialBlockHeight?: bigint;

  attributes: Record<string, any>;
};
