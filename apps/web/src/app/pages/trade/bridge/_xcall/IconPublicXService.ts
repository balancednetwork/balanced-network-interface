import IconService, { Converter, BigNumber } from 'icon-sdk-js';

import { XCallEventType, XChainId } from 'app/pages/trade/bridge/types';
import { TransactionStatus, XCallDestinationEvent, XCallEvent } from '../_zustand/types';
import { fetchTxResult } from 'app/_xcall/_icon/utils';
import { AbstractPublicXService } from './types';

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

export class IconPublicXService extends AbstractPublicXService {
  xChainId: XChainId;
  publicClient: IconService;

  constructor(xChainId: XChainId, publicClient: IconService) {
    super();
    this.xChainId = xChainId;
    this.publicClient = publicClient;
  }

  async getXCallFee(to: XChainId, rollback: boolean) {
    return Promise.resolve({
      rollback: 0n,
      noRollback: 0n,
    });
  }
  async getBlockHeight() {
    const lastBlock = await this.publicClient.getLastBlock().execute();
    return BigInt(lastBlock.height);
  }
  async getBlock(blockHeight: bigint) {
    const block = await this.publicClient.getBlockByHeight(new BigNumber(blockHeight.toString())).execute();
    return block;
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

  async getTxReceipt(txHash: string) {
    //TODO: update to use this.publicClient
    return await fetchTxResult(txHash);
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

  getScanBlockCount() {
    return 1n;
  }

  async getEventLogs({ startBlockHeight, endBlockHeight }: { startBlockHeight: bigint; endBlockHeight: bigint }) {
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

  _parseCallMessageSentEventLog(eventLog, txHash: string): XCallEvent {
    const sn = parseInt(eventLog.indexed[3], 16);

    return {
      eventType: XCallEventType.CallMessageSent,
      sn: BigInt(sn),
      xChainId: this.xChainId,
      rawEventData: eventLog,
      txHash,
    };
  }
  _parseCallMessageEventLog(eventLog, txHash: string): XCallDestinationEvent {
    const sn = parseInt(eventLog.indexed[3], 16);
    const reqId = parseInt(eventLog.data[0], 16);

    return {
      eventType: XCallEventType.CallMessage,
      sn: BigInt(sn),
      reqId: BigInt(reqId),
      xChainId: this.xChainId,
      rawEventData: eventLog,
      txHash,
      isSuccess: true,
    };
  }
  _parseCallExecutedEventLog(eventLog, txHash: string): XCallDestinationEvent {
    const reqId = parseInt(eventLog.indexed[1], 16);
    // TODO: check for success?
    // const success = eventLog.data[0] === '0x1';

    return {
      eventType: XCallEventType.CallExecuted,
      sn: -1n,
      reqId: BigInt(reqId),
      xChainId: this.xChainId,
      rawEventData: eventLog,
      txHash,
      isSuccess: true,
    };
  }
}
