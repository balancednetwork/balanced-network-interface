import { CHAIN_INFO } from '@balancednetwork/balanced-js';
import IconService, { BigNumber } from 'icon-sdk-js';

import { NETWORK_ID } from 'constants/config';

import { AUTO_EXECUTION_ON_ARCHWAY } from '../archway/config';
import { OriginXCallData, SupportedXCallChains, XCallEvent, XCallEventType } from '../types';
import { ICONBlockType, ICONTxEvent, ICONTxResultType } from './types';

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
      return txResult as ICONTxResultType;
    } catch (e) {
      console.log(`xCall debug - icon tx result (pass ${i}):`, e);
    }
    await sleep(1000);
  }
}

export async function fetchBlock(height: string): Promise<ICONBlockType | undefined> {
  const heightNumber = new BigNumber(height, 16).minus(1);
  for (let i = 0; i < 10; i++) {
    try {
      const block = await iconService.getBlockByHeight(heightNumber).execute();
      return block as ICONBlockType;
    } catch (e) {
      console.log(`xCall debug - icon tx result (pass ${i}):`, e);
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
      return 'ResponseMessage(int,int,str)';
    }
    case XCallEvent.RollbackMessage: {
      return 'RollbackMessage(int)';
    }
    default:
      return 'none';
  }
};

export function getXCallOriginEventDataFromICON(
  callMessageSentLog: ICONTxEvent,
  destination: SupportedXCallChains,
  descriptionAction: string,
  descriptionAmount: string,
  autoExecute?: boolean,
): OriginXCallData {
  const sn = parseInt(callMessageSentLog.indexed[3], 16);
  const rollback = false;
  const eventName = XCallEvent.CallMessageSent;
  const autoExec = autoExecute === undefined && destination === 'archway' ? AUTO_EXECUTION_ON_ARCHWAY : undefined;
  return {
    sn,
    rollback,
    eventName,
    chain: 'icon',
    destination: destination,
    timestamp: new Date().getTime(),
    descriptionAction,
    descriptionAmount,
    autoExecute: autoExecute || !!autoExec,
  };
}

export function getCallMessageSentEventFromLogs(logs: ICONTxEvent[]): ICONTxEvent | undefined {
  return logs.find(event => event.indexed.includes(getICONEventSignature(XCallEvent.CallMessageSent)));
}

export async function getTxFromCallExecutedLog(
  blockHash: string,
  indexes: string[],
  reqId: string,
): Promise<ICONTxResultType | undefined> {
  const block = await fetchBlock(blockHash);
  if (block) {
    const indexesDecimal = indexes.map(i => parseInt(i, 16));
    const transactions = await Promise.all(
      indexesDecimal.map(async index => await fetchTxResult(block.confirmedTransactionList[index].txHash)),
    );
    const tx = transactions.find(transaction => {
      const callExecutedLog = transaction?.eventLogs.find(event =>
        event.indexed.includes(getICONEventSignature(XCallEvent.CallExecuted)),
      );
      if (callExecutedLog) {
        const reqIdFromLog = callExecutedLog.indexed[1];
        return reqId === reqIdFromLog;
      } else {
        return false;
      }
    });

    return tx;
  }
}
