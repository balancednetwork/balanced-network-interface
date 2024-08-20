import IconService, { BigNumber, Converter } from 'icon-sdk-js';

import { XChainId } from '@/types';
import { sleep } from '@/utils';
import { XPublicClient } from '@/xwagmi/core/XPublicClient';
import {
  TransactionStatus,
  XCallEvent,
  XCallExecutedEvent,
  XCallMessageEvent,
  XCallMessageSentEvent,
} from '../../../lib/xcall/_zustand/types';
import { XCallEventType } from '../../../lib/xcall/types';
import { ICONTxResultType } from '../icon/types';
import { HavahXService } from './HavahXService';
import { havahJs } from './havahJs';

export const getICONEventSignature = (eventName: XCallEventType) => {
  switch (eventName) {
    case XCallEventType.CallMessage: {
      return 'CallMessage(str,str,int,int,bytes)';
    }
    case XCallEventType.CallExecuted: {
      return 'CallExecuted(int,int,str)';
    }
    case XCallEventType.CallMessageSent: {
      return 'CallMessageSent(Address,str,int)';
    }
    case XCallEventType.ResponseMessage: {
      return 'ResponseMessage(int,int,str)';
    }
    case XCallEventType.RollbackMessage: {
      return 'RollbackMessage(int)';
    }
    default:
      return 'none';
  }
};

export class HavahXPublicClient extends XPublicClient {
  getXService(): HavahXService {
    return HavahXService.getInstance();
  }

  getPublicClient(): IconService {
    return havahJs.provider;
  }

  async getXCallFee(xChainId: XChainId, nid: XChainId, rollback: boolean, sources?: string[]) {
    const res = await havahJs.XCall.getFee(nid, rollback, sources);
    return BigInt(res);
  }

  async getBlockHeight() {
    const lastBlock = await this.getPublicClient().getLastBlock().execute();
    return BigInt(lastBlock.height);
  }

  async getBlock(blockHeight: bigint) {
    const block = await this.getPublicClient().getBlockByHeight(new BigNumber(blockHeight.toString())).execute();
    return block;
  }

  async getTxReceipt(txHash: string) {
    for (let i = 0; i < 10; i++) {
      try {
        const txResult = await this.getPublicClient().getTransactionResult(txHash).execute();
        return txResult as ICONTxResultType;
      } catch (e) {
        console.log(`xCall debug - icon tx result (pass ${i}):`, e);
      }
      await sleep(1000);
    }
  }

  getTxEventLogs(rawTx) {
    return rawTx?.eventLogs;
  }

  deriveTxStatus(rawTx): TransactionStatus {
    if (rawTx) {
      const status = Converter.toNumber(rawTx.status);
      if (status === 1) {
        return TransactionStatus.success;
      } else {
        return TransactionStatus.failure;
      }
    }
    return TransactionStatus.pending;
  }
  // didn't find rpc method to get event logs for a block, used getBlock and getTxReceipt instead
  async getBlockEventLogs(blockHeight: bigint) {
    const events: any = [];
    const block = await this.getBlock(blockHeight);
    if (block && block.confirmedTransactionList && block.confirmedTransactionList.length > 0) {
      for (const tx of block.confirmedTransactionList) {
        const txResult = await this.getTxReceipt(tx.txHash);

        if (txResult && txResult.txHash) {
          const eventLogs = txResult.eventLogs.map(e => ({ ...e, transactionHash: txResult.txHash }));
          events.push(...eventLogs);
        } else {
          throw new Error('Failed to get tx result');
        }
      }
    }
    return events;
  }

  getScanBlockCount() {
    return 1n;
  }

  async getEventLogs(
    xChainId: XChainId,
    { startBlockHeight, endBlockHeight }: { startBlockHeight: bigint; endBlockHeight: bigint },
  ) {
    const events: any[] = [];
    for (let i = startBlockHeight; i <= endBlockHeight; i++) {
      const eventLogs: any[] = await this.getBlockEventLogs(i);
      events.push(...eventLogs);
    }
    return events;
  }

  parseEventLogs(eventLogs: any[]): XCallEvent[] {
    const events: any[] = [];
    [XCallEventType.CallMessageSent, XCallEventType.CallMessage, XCallEventType.CallExecuted].forEach(eventType => {
      const parsedEventLogs = this._filterEventLogs(eventLogs, eventType).map(eventLog =>
        this._parseEventLog(eventLog, eventLog.transactionHash, eventType),
      );
      events.push(...parsedEventLogs);
    });
    return events;
  }

  // _filterEventLogs(eventLogs, sig, address = null) {
  //   return eventLogs.filter(event => {
  //     return event.indexed && event.indexed[0] === sig && (!address || address === event.scoreAddress);
  //   });
  // }

  _filterEventLogs(eventLogs, eventType: XCallEventType) {
    const signature = getICONEventSignature(eventType);

    if (eventType === XCallEventType.CallMessageSent) {
      return eventLogs.filter(event => event.indexed && event.indexed.includes(signature));
    } else if (eventType === XCallEventType.CallMessage || eventType === XCallEventType.CallExecuted) {
      return eventLogs.filter(event => event.indexed && event.indexed[0] === signature);
    }

    throw new Error(`Unknown xCall event type: ${eventType}`);
  }

  _parseEventLog(eventLog: any, txHash: string, eventType: XCallEventType): XCallEvent {
    if (eventType === XCallEventType.CallMessageSent) {
      return this._parseCallMessageSentEventLog(eventLog, txHash);
    } else if (eventType === XCallEventType.CallMessage) {
      return this._parseCallMessageEventLog(eventLog, txHash);
    } else if (eventType === XCallEventType.CallExecuted) {
      return this._parseCallExecutedEventLog(eventLog, txHash);
    }

    throw new Error(`Unknown xCall event type: ${eventType}`);
  }

  _parseCallMessageSentEventLog(eventLog, txHash: string): XCallMessageSentEvent {
    const indexed = eventLog.indexed || [];
    // const data = eventLog.data || [];

    return {
      eventType: XCallEventType.CallMessageSent,
      // xChainId: this.xChainId,
      txHash,
      // rawEventData: eventLog,
      from: indexed[1],
      to: indexed[2],
      sn: BigInt(parseInt(indexed[3], 16)),
    };
  }
  _parseCallMessageEventLog(eventLog, txHash: string): XCallMessageEvent {
    const indexed = eventLog.indexed || [];
    const data = eventLog.data || [];

    return {
      eventType: XCallEventType.CallMessage,
      // xChainId: this.xChainId,
      txHash,
      // rawEventData: eventLog,
      sn: BigInt(parseInt(indexed[3], 16)),
      reqId: BigInt(parseInt(data[0], 16)),
      from: indexed[1],
      to: indexed[2],
      data: data[1],
    };
  }
  _parseCallExecutedEventLog(eventLog, txHash: string): XCallExecutedEvent {
    const indexed = eventLog.indexed || [];
    const data = eventLog.data || [];

    return {
      eventType: XCallEventType.CallExecuted,
      // xChainId: this.xChainId,
      txHash,
      // rawEventData: eventLog,
      reqId: BigInt(parseInt(indexed[1], 16)),
      code: parseInt(data[0], 16),
      msg: data[1],
    };
  }
}
