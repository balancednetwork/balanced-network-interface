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

import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { RouteAction } from '@balancednetwork/v1-sdk';

import { CurrencyKey, XChainId, XToken } from '@/types';

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
  //swap & bridge
  SWAP = 'swap',
  BRIDGE = 'bridge',
  SWAP_ON_ICON = 'swap_on_icon',

  // lend & borrow
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
  BORROW = 'borrow',
  REPAY = 'repay',

  // add liquidity
}

export enum XMessageStatus {
  REQUESTED = 'REQUESTED',
  FAILED = 'FAILED',
  // COMPLETED = 'COMPLETED',

  AWAITING_CALL_MESSAGE_SENT = 'AWAITING_CALL_MESSAGE_SENT',
  CALL_MESSAGE_SENT = 'CALL_MESSAGE_SENT', // pending
  CALL_MESSAGE = 'CALL_MESSAGE', // delivered
  CALL_EXECUTED = 'CALL_EXECUTED', // executed
  ROLLBACKED = 'ROLLBACKED', // rollbacked
}

export type XTransactionInput = {
  direction: {
    from: XChainId;
    to: XChainId;
  };
  type: XTransactionType;
  inputAmount: CurrencyAmount<XToken>;
  account: string;
  xCallFee: IXCallFee;
  // xswap
  recipient?: string;
  outputAmount?: CurrencyAmount<XToken>;
  minReceived?: CurrencyAmount<XToken>;
  path?: RouteAction[];
  usedCollateral?: CurrencyKey;
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
  xTransactionId: string;

  sourceChainId: XChainId;
  destinationChainId: XChainId;
  sourceTransactionHash: string;
  destinationTransactionHash?: string;

  events: XCallEventMap;
  status: XMessageStatus;
  destinationChainInitialBlockHeight: bigint;
  isPrimary: boolean;

  useXCallScanner?: boolean;
  xCallScannerData?: any;
  createdAt: number; // timestamp in milliseconds
};

export type XTransaction = {
  id: string;
  type: XTransactionType;
  status: XTransactionStatus;

  secondaryMessageRequired: boolean;

  sourceChainId: XChainId;
  finalDestinationChainId: XChainId;
  finalDestinationChainInitialBlockHeight: bigint;

  createdAt: number; // timestamp in milliseconds
  input: XTransactionInput;
};
