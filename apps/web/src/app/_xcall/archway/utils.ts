import { Token } from '@balancednetwork/sdk-core';
import { Event } from '@cosmjs/cosmwasm-stargate';

import { DestinationXCallData, OriginXCallData, XCallEventType } from 'app/_xcall/types';
import { NETWORK_ID } from 'constants/config';

import { ARCHWAY_EVENT_XCALL_MSG_SENT } from './types';
import { StdFee } from '@archwayhq/arch3.js';
import { archway, icon } from '../../pages/trade/bridge-v2/config';

export function getXCallOriginEventDataFromArchway(
  events: readonly Event[],
  descriptionAction: string,
  descriptionAmount: string,
  autoExecute: boolean = icon.autoExecution,
): OriginXCallData | undefined {
  const xCallSentEvent = events.find(e => e.type === ARCHWAY_EVENT_XCALL_MSG_SENT);
  // const xCallDataEvent = events.find(e => e.type === 'wasm-send_packet');
  // const data = xCallDataEvent && xCallDataEvent.attributes.find(a => a.key === 'packet_data_hex')?.value;
  const sn = xCallSentEvent && xCallSentEvent.attributes.find(a => a.key === 'sn')?.value;

  if (sn) {
    return {
      sn: parseInt(sn),
      eventName: XCallEventType.CallMessageSent,
      chain: 'archway-1',
      destination: '0x1.icon',
      timestamp: new Date().getTime(),
      descriptionAction,
      descriptionAmount,
      autoExecute: autoExecute,
    };
  }
}

export function getXCallDestinationEventDataFromArchwayEvent(
  events: readonly Event[],
): DestinationXCallData | undefined {
  const dataRaw = events['wasm-CallMessage.data'];
  const snRaw = events['wasm-CallMessage.sn'];
  const reqIdRaw = events['wasm-CallMessage.reqId'];
  const data = dataRaw && (dataRaw[0] as string);
  const sn = snRaw && parseInt(snRaw[0]);
  const reqId = reqIdRaw && parseInt(reqIdRaw[0]);

  if (data && sn && reqId) {
    return {
      data,
      sn,
      reqId,
      eventName: XCallEventType.CallMessage,
      chain: 'archway-1',
      origin: '0x1.icon',
      //TODO: get autoExecute value from origin event
      autoExecute: archway.autoExecution,
    };
  }
}

export function getCallExecutedEventDataFromArchwayEvent(
  events: readonly Event[],
): { reqId: number; success: boolean } | undefined {
  const reqIdRaw = events['wasm-CallExecuted.reqId'];
  const success = events['wasm-CallExecuted.msg']?.[0] === 'success';
  return {
    reqId: reqIdRaw && parseInt(reqIdRaw[0]),
    success,
  };
}

export function getRollbackEventDataFromArchwayEvent(events: readonly Event[]): { sn: string } | undefined {
  const snRaw = events['wasm-RollbackMessage.sn'];
  const sn: string = snRaw && snRaw[0];

  if (sn) {
    return {
      sn,
    };
  }
}

export function getFeeParam(fee: number): StdFee | 'auto' {
  return NETWORK_ID === 1
    ? 'auto'
    : {
        amount: [{ amount: '56000000000000000', denom: 'aconst' }],
        gas: `${fee}`,
      };
}

export function isDenomAsset(token: Token): boolean {
  return token.address.startsWith('ibc/');
}
