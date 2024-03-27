import { Event } from '@cosmjs/cosmwasm-stargate';

export type SupportedXCallChains = 'icon' | 'archway';

export type XCallEventType =
  | 'CallMessageSent'
  | 'CallMessage'
  | 'ResponseMessage'
  | 'RollbackMessage'
  | 'CallExecuted'
  | 'RollbackExecuted';

export const XCallEvent: { [key in XCallEventType]: XCallEventType } = Object.freeze({
  CallMessageSent: 'CallMessageSent',
  CallMessage: 'CallMessage',
  ResponseMessage: 'ResponseMessage',
  RollbackMessage: 'RollbackMessage',
  CallExecuted: 'CallExecuted',
  RollbackExecuted: 'RollbackExecuted',
});
export type OriginXCallData = {
  sn: number;
  rollback?: boolean;
  rollbackRequired?: boolean;
  rollbackReady?: boolean;
  eventName: XCallEventType;
  chain: SupportedXCallChains;
  destination: SupportedXCallChains;
  autoExecute?: boolean;
  timestamp: number;
  descriptionAction: string;
  descriptionAmount: string;
  isPristine?: boolean;
};

export type DestinationXCallData = {
  sn: number;
  reqId: number;
  data: string;
  eventName: XCallEventType;
  chain: SupportedXCallChains;
  origin: SupportedXCallChains;
  autoExecute?: boolean;
  isPristine?: boolean;
};

export type XCallChainState = {
  origin: OriginXCallData[];
  destination: DestinationXCallData[];
};

export type XCallDirection = {
  origin: SupportedXCallChains;
  destination: SupportedXCallChains;
};

export type CurrentXCallStateType =
  | 'IDLE'
  | 'AWAKE'
  | 'AWAITING_DESTINATION_CALL_MESSAGE'
  | 'AWAITING_USER_CALL_EXECUTION'
  | 'AWAITING_ORIGIN_ROLLBACK_MESSAGE'
  | 'AWAITING_ORIGIN_RESPONSE_MESSAGE';

export const CurrentXCallState: { [key in CurrentXCallStateType]: CurrentXCallStateType } = Object.freeze({
  IDLE: 'IDLE',
  AWAKE: 'AWAKE',
  AWAITING_DESTINATION_CALL_MESSAGE: 'AWAITING_DESTINATION_CALL_MESSAGE',
  AWAITING_USER_CALL_EXECUTION: 'AWAITING_USER_CALL_EXECUTION',

  // raised every time _rollback wasn't null
  AWAITING_ORIGIN_RESPONSE_MESSAGE: 'AWAITING_ORIGIN_RESPONSE_MESSAGE',

  // raised when _rollback wasn't null and executeCall failed - revert happened in execution
  AWAITING_ORIGIN_ROLLBACK_MESSAGE: 'AWAITING_ORIGIN_ROLLBACK_MESSAGE',
});

export type CrossChainTxType = {
  transactionHash: string;
  events: readonly Event[];
};

export type XCallActivityItem = {
  chain: SupportedXCallChains;
  originData: OriginXCallData;
  destinationData?: DestinationXCallData;
  status: 'pending' | 'executable' | 'failed' | 'rollbackReady';
};
