import { Event } from '@cosmjs/cosmwasm-stargate';

export enum XCallEventType {
  CallMessageSent = 'CallMessageSent',
  CallMessage = 'CallMessage',
  ResponseMessage = 'ResponseMessage',
  RollbackMessage = 'RollbackMessage',
  CallExecuted = 'CallExecuted',
  RollbackExecuted = 'RollbackExecuted',
}

export type CrossChainTxType = {
  transactionHash: string;
  events: readonly Event[];
};

export interface IXCallFee {
  noRollback: bigint;
  rollback: bigint;
}
