import { CHAIN_INFO } from '@balancednetwork/balanced-js';
import IconService from 'icon-sdk-js';

import { NETWORK_ID } from 'constants/config';

import { OriginXCallData, XCallEvent, XCallEventType } from '../types';
import { ICONTxEvent, ICONTxResultType } from './types';

export const httpProvider = new IconService.HttpProvider(CHAIN_INFO[NETWORK_ID].APIEndpoint);
export const iconService = new IconService(httpProvider);

async function sleep(time) {
  await new Promise(resolve => {
    setTimeout(resolve, time);
  });
}

export async function fetchTxResult(hash: string): Promise<ICONTxResultType | undefined> {
  for (let i = 0; i < 10; i++) {
    try {
      const txResult = await iconService.getTransactionResult(hash).execute();
      console.log('awaited: ', txResult);
      return txResult as ICONTxResultType;
    } catch (e) {
      console.log(`txResult (pass ${i}):`, e);
    }
    await sleep(1000);
  }
}

export const getICONEventSignature = (eventName: XCallEventType) => {
  switch (eventName) {
    case XCallEvent.CallMessage: {
      return 'CallMessage(str,str,int,int,bytes)';
    }
    case XCallEvent.CallExecuted: {
      return 'CallExecuted(int,int,str)';
    }
    case XCallEvent.CallMessageSent: {
      return 'CallMessageSent(Address,str,int)';
    }
    case XCallEvent.ResponseMessage: {
      return '';
    }
    case XCallEvent.RollbackMessage: {
      return 'w';
    }
    default:
      return 'none';
  }
};

export function getXCallOriginEventDataFromICON(callMessageSentLog: ICONTxEvent): OriginXCallData {
  const sn = parseInt(callMessageSentLog.indexed[3], 16);
  const rollback = false;
  const eventName = XCallEvent.CallMessageSent;
  return { sn, rollback, eventName };
}
