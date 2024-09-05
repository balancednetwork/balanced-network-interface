import { Event } from '@cosmjs/cosmwasm-stargate';

export enum XCallEventType {
  CallMessageSent = 'CallMessageSent',
  CallMessage = 'CallMessage',
  ResponseMessage = 'ResponseMessage',
  RollbackMessage = 'RollbackMessage',
  CallExecuted = 'CallExecuted',
  RollbackExecuted = 'RollbackExecuted',
}

export interface IXCallFee {
  noRollback: bigint;
  rollback: bigint;
}

import { Currency, CurrencyAmount, TradeType } from '@balancednetwork/sdk-core';
import { Trade } from '@balancednetwork/v1-sdk';

import { CurrencyKey, XChainId } from '@/xwagmi/types';

export enum TransactionStatus {
  pending = 'pending',
  success = 'success',
  failure = 'failure',
}

export enum XTransactionStatus {
  pending = 'pending',
  success = 'success',
  failure = 'failure',
}

export enum XTransactionType {
  SWAP = 'swap',
  BRIDGE = 'bridge',
  SUPPLY = 'supply',
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
  BORROW = 'borrow',
  REPAY = 'repay',
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

export type XTransactionInput = {
  direction: {
    from: XChainId;
    to: XChainId;
  };
  type: XTransactionType;
  inputAmount: CurrencyAmount<Currency>;
  account: string;
  xCallFee: IXCallFee;
  callback?: () => void;
  // xswap
  recipient?: string;
  executionTrade?: Trade<Currency, Currency, TradeType>;
  usedCollateral?: CurrencyKey;
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

export type XCallMessageEvent = {
  eventType: XCallEventType;
  txHash: string;
  sn: bigint;
  reqId: bigint;
  from: string;
  to: string;
  data: any;
};
export type XCallExecutedEvent = {
  eventType: XCallEventType;
  txHash: string;
  reqId: bigint;
  code: number;
  msg: string;
};
export type XCallMessageSentEvent = {
  eventType: XCallEventType;
  txHash: string;
  sn: bigint;
  from: string;
  to: string;
};

export type XCallDestinationEvent = XCallMessageEvent | XCallExecutedEvent;
export type XCallEvent = XCallDestinationEvent | XCallMessageSentEvent;

export type XCallEventMap = Partial<{
  [XCallEventType.CallMessageSent]: XCallMessageSentEvent;
  [XCallEventType.CallMessage]: XCallMessageEvent;
  [XCallEventType.CallExecuted]: XCallExecutedEvent;
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
  isSecondaryMessage?: boolean;
  // onSuccess: (xMessage: XMessage) => Promise<void>;
  // onFail: (xMessage: XMessage) => Promise<void>;
};

export type XTransaction = {
  id: string;
  type: XTransactionType;
  status: XTransactionStatus;

  primaryMessageId: string;
  secondaryMessageId?: string;
  secondaryMessageRequired: boolean;

  sourceChainId: XChainId;
  // primaryDestinationChainId: XChainId;
  finalDestinationChainId: XChainId;
  finalDestinationChainInitialBlockHeight: bigint;

  attributes: Record<string, any>;
};
