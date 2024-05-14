import { Currency, CurrencyAmount, TradeType } from '@balancednetwork/sdk-core';
import { Trade } from '@balancednetwork/v1-sdk';
import { IXCallFee, XCallEventType, XChainId } from 'app/pages/trade/bridge/types';

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

// export type BridgeInfo = {
//   bridgeDirection: {
//     from: XChainId;
//     to: XChainId;
//   };
//   currencyAmountToBridge: CurrencyAmount<Currency>;
//   recipient: string;
//   account: string;
//   xCallFee: IXCallFee;
//   isLiquidFinanceEnabled?: boolean;
//   isDenom?: boolean;
// };

// export type SwapInfo = {
//   direction: {
//     from: XChainId;
//     to: XChainId;
//   };
//   inputAmount: CurrencyAmount<Currency>;
//   account: string;
//   recipient: string;
//   xCallFee: IXCallFee;
//   executionTrade: Trade<Currency, Currency, TradeType>;
//   slippageTolerance: number;
// };

export type XSwapInfo = {
  direction: {
    from: XChainId;
    to: XChainId;
  };
  type: BridgeTransferType;
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

export enum BridgeTransferType {
  SWAP = 'swap',
  BRIDGE = 'bridge',
}

export type BridgeTransfer = {
  id: string;
  type: BridgeTransferType;
  sourceChainId: XChainId;
  destinationChainId: XChainId;
  sourceTransaction: Transaction;
  destinationTransaction?: Transaction;
  events: XCallEventMap;
  status: BridgeTransferStatus;
  destinationChainInitialBlockHeight: bigint;
  xSwapInfo: XSwapInfo;
  childTransferNeeded: boolean;
  childTransferId?: string;
  parentTransferId?: string;
};
