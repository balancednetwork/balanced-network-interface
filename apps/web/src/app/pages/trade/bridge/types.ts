import { XChainId } from '@/types';
import { Event } from '@cosmjs/cosmwasm-stargate';

export enum XCallEventType {
  CallMessageSent = 'CallMessageSent',
  CallMessage = 'CallMessage',
  ResponseMessage = 'ResponseMessage',
  RollbackMessage = 'RollbackMessage',
  CallExecuted = 'CallExecuted',
  RollbackExecuted = 'RollbackExecuted',
}

export type OriginXCallData = {
  sn: number;
  rollback?: boolean;
  rollbackRequired?: boolean;
  rollbackReady?: boolean;
  eventName: XCallEventType;
  chain: XChainId;
  destination: XChainId;
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
  chain: XChainId;
  origin: XChainId;
  autoExecute?: boolean;
  isPristine?: boolean;
};

export type XCallChainState = {
  origin: OriginXCallData[];
  destination: DestinationXCallData[];
};

export type XCallDirection = {
  origin: XChainId;
  destination: XChainId;
};

export enum CurrentXCallStateType {
  IDLE = 'IDLE',
  AWAKE = 'AWAKE',
  AWAITING_DESTINATION_CALL_MESSAGE = 'AWAITING_DESTINATION_CALL_MESSAGE',
  AWAITING_USER_CALL_EXECUTION = 'AWAITING_USER_CALL_EXECUTION',
  AWAITING_ORIGIN_ROLLBACK_MESSAGE = 'AWAITING_ORIGIN_ROLLBACK_MESSAGE',
  AWAITING_ORIGIN_RESPONSE_MESSAGE = 'AWAITING_ORIGIN_RESPONSE_MESSAGE',
}

export type CrossChainTxType = {
  transactionHash: string;
  events: readonly Event[];
};

export type XCallActivityItem = {
  chain: XChainId;
  originData: OriginXCallData;
  destinationData?: DestinationXCallData;
  status: 'pending' | 'executable' | 'failed' | 'rollbackReady';
};

export interface IXCallFee {
  noRollback: bigint;
  rollback: bigint;
}

export enum MessagingProtocolId {
  BTP = 'BTP',
  IBC = 'IBC',
  // centralized relay
  C_RELAY = 'C_RELAY',
}

export type BridgePair = {
  chains: [XChainId, XChainId];
  protocol: MessagingProtocolId;
};

export interface MessagingProtocol {
  id: MessagingProtocolId;
  name: string;
  description: string;
}
