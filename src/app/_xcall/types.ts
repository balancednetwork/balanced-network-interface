export type SupportedXCallChains = 'icon' | 'archway';

export type OriginXCallData = {
  sn: number;
  rollback?: boolean;
};

export type DestinationXCallData = {
  sn: number;
  reqId: string;
  data: string;
};

export type XCallChainState = {
  origin: OriginXCallData[];
  destination: DestinationXCallData[];
};

export type CurrentXCallStateType =
  | 'IDLE'
  | 'AWAITING_DESTINATION_CALL_MESSAGE'
  | 'AWAITING_USER_CALL_EXECUTION'
  | 'AWAITING_ORIGIN_ROLLBACK_MESSAGE'
  | 'AWAITING_ORIGIN_RESPONSE_MESSAGE';

export const CurrentXCallState: { [key in CurrentXCallStateType]: CurrentXCallStateType } = Object.freeze({
  IDLE: 'IDLE',
  AWAITING_DESTINATION_CALL_MESSAGE: 'AWAITING_DESTINATION_CALL_MESSAGE',
  AWAITING_USER_CALL_EXECUTION: 'AWAITING_USER_CALL_EXECUTION',

  // raised every time _rollback wasn't null
  AWAITING_ORIGIN_RESPONSE_MESSAGE: 'AWAITING_ORIGIN_RESPONSE_MESSAGE',

  // raised when _rollback wasn't null and executeCall failed - revert happened in execution
  AWAITING_ORIGIN_ROLLBACK_MESSAGE: 'AWAITING_ORIGIN_ROLLBACK_MESSAGE',
});

export type XCallEventType = 'CallMessageSent' | 'CallMessage' | 'ResponseMessage' | 'RollbackMessage' | 'CallExecuted';

export const XCallEvent: { [key in XCallEventType]: XCallEventType } = Object.freeze({
  CallMessageSent: 'CallMessageSent',
  CallMessage: 'CallMessage',
  ResponseMessage: 'ResponseMessage',
  RollbackMessage: 'RollbackMessage',
  CallExecuted: 'CallExecuted',
});
