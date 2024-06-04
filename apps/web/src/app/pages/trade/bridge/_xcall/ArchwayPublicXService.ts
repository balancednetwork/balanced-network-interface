import { ArchwayClient } from '@archwayhq/arch3.js';

import { archway } from 'app/pages/trade/bridge/_config/xChains';

import { XCallEventType, XChainId } from 'app/pages/trade/bridge/types';
import { AbstractPublicXService } from './types';
import { TransactionStatus, XCallEvent, XCallSourceEvent, XCallDestinationEvent } from '../_zustand/types';

const XCallEventSignatureMap = {
  [XCallEventType.CallMessageSent]: 'wasm-CallMessageSent',
  [XCallEventType.CallMessage]: 'wasm-CallMessage',
  [XCallEventType.CallExecuted]: 'wasm-CallExecuted',
};

export class ArchwayPublicXService extends AbstractPublicXService {
  xChainId: XChainId;
  publicClient: ArchwayClient;

  constructor(xChainId: XChainId, publicClient: ArchwayClient) {
    super();
    this.xChainId = xChainId;
    this.publicClient = publicClient;
  }

  async getXCallFee(nid: XChainId, rollback: boolean) {
    return await this.publicClient.queryContractSmart(archway.contracts.xCall, {
      get_fee: { nid: nid, rollback },
    });
  }

  async getBlockHeight() {
    const height = await this.publicClient.getHeight();
    return BigInt(height);
  }

  async getBlock(blockHeight: bigint) {
    const block = await this.publicClient.getBlock(Number(blockHeight));
    return block;
  }

  async getTxReceipt(txHash) {
    const tx = await this.publicClient.getTx(txHash);
    return tx;
  }

  getTxEventLogs(rawTx) {
    return rawTx?.events;
  }

  // TODO: review again
  deriveTxStatus(rawTx: any): TransactionStatus {
    if (rawTx) {
      if (rawTx.code) {
        return TransactionStatus.failure;
      }

      return TransactionStatus.success;
    }

    return TransactionStatus.failure;
  }

  async getEventLogs({ startBlockHeight, endBlockHeight }: { startBlockHeight: bigint; endBlockHeight: bigint }) {
    let txs;

    // TODO: is 10 iterations enough?
    for (let i = 0; i < 10; i++) {
      txs = await this.publicClient.searchTx(`tx.height>=${startBlockHeight} AND tx.height<=${endBlockHeight}`);

      if (txs) {
        break;
      }
    }

    // txs is an array of tx, each tx has events, which is an array of event, return all events merged
    const events = txs.flatMap(tx => tx.events.map(e => ({ ...e, transactionHash: tx.hash })));

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

  _filterEventLogs(eventLogs, xCallEventType: XCallEventType) {
    return eventLogs.filter(e => XCallEventSignatureMap[xCallEventType] === e.type);
  }

  _parseEventLog(eventLog: any, txHash: string, eventType: XCallEventType): XCallEvent {
    if (eventType === XCallEventType.CallMessageSent) {
      return this._parseCallMessageSentEventLog(eventLog, txHash);
    }
    if (eventType === XCallEventType.CallMessage) {
      return this._parseCallMessageEventLog(eventLog, txHash);
    }
    if (eventType === XCallEventType.CallExecuted) {
      return this._parseCallExecutedEventLog(eventLog, txHash);
    }

    throw new Error(`Unknown xCall event type: ${eventType}`);
  }

  _parseCallMessageSentEventLog(eventLog, txHash: string): XCallSourceEvent {
    const sn = eventLog.attributes.find(a => a.key === 'sn')?.value;

    return {
      eventType: XCallEventType.CallMessageSent,
      sn: BigInt(sn),
      xChainId: this.xChainId,
      rawEventData: eventLog,
      txHash,
    };
  }
  _parseCallMessageEventLog(eventLog, txHash: string): XCallDestinationEvent {
    const sn = eventLog.attributes.find(a => a.key === 'sn')?.value;
    const reqId = eventLog.attributes.find(a => a.key === 'reqId')?.value;

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
    const reqId = eventLog.attributes.find(a => a.key === 'reqId')?.value;

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
