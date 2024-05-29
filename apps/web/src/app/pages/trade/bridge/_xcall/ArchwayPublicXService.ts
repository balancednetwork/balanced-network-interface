import { ArchwayClient } from '@archwayhq/arch3.js';

import { archway, xChainMap } from 'app/pages/trade/bridge/_config/xChains';

import { XCallEventType, XChainId } from 'app/pages/trade/bridge/types';
import { IPublicXService } from './types';
import { TransactionStatus, Transaction, XCallDestinationEvent, XCallSourceEvent } from '../_zustand/types';

export class ArchwayPublicXService implements IPublicXService {
  xChainId: XChainId;
  publicClient: ArchwayClient;

  constructor(xChainId: XChainId, publicClient: ArchwayClient) {
    this.xChainId = xChainId;
    this.publicClient = publicClient;
  }

  async getXCallFee(to: XChainId, rollback: boolean) {
    return await this.publicClient.queryContractSmart(archway.contracts.xCall, {
      get_fee: { nid: xChainMap[to].xChainId, rollback },
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

  // TODO: deprecate
  async getBlockEventLogs(blockHeight: bigint) {
    let txs;

    // TODO: is 10 iterations enough?
    for (let i = 0; i < 10; i++) {
      txs = await this.publicClient.searchTx(`tx.height=${blockHeight}`);
      if (txs) {
        break;
      }
    }

    // txs is an array of tx, each tx has events, which is an array of event, return all events merged
    const events = txs.flatMap(tx => tx.events.map(e => ({ ...e, transactionHash: tx.hash })));
    return events;
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

  parseCallMessageSentEventLog(eventLog, txHash: string): XCallSourceEvent {
    const sn = eventLog.attributes.find(a => a.key === 'sn')?.value;

    return {
      eventType: XCallEventType.CallMessageSent,
      sn: BigInt(sn),
      xChainId: this.xChainId,
      rawEventData: eventLog,
      txHash,
    };
  }
  parseCallMessageEventLog(eventLog, txHash: string): XCallDestinationEvent {
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
  parseCallExecutedEventLog(eventLog, txHash: string): XCallDestinationEvent {
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

  async filterEventLogs(eventLogs, signature) {
    return eventLogs.filter(e => e.type === signature);
  }

  filterCallMessageSentEventLog(eventLogs) {
    const eventFiltered = eventLogs.find(e => e.type === 'wasm-CallMessageSent');
    return eventFiltered;
  }

  filterCallMessageEventLogs(eventLogs) {
    const eventFiltered = this.filterEventLogs(eventLogs, 'wasm-CallMessage');
    return eventFiltered;
  }

  filterCallExecutedEventLogs(eventLogs) {
    const eventFiltered = this.filterEventLogs(eventLogs, 'wasm-CallExecuted');
    return eventFiltered;
  }

  async getSourceEvents(sourceTransaction: Transaction) {
    try {
      const callMessageSentEventLog = this.filterCallMessageSentEventLog(sourceTransaction.rawEventLogs);
      return {
        [XCallEventType.CallMessageSent]: this.parseCallMessageSentEventLog(
          callMessageSentEventLog,
          sourceTransaction.hash,
        ),
      };
    } catch (e) {
      console.error(e);
    }
    return {};
  }

  getScanBlockCount() {
    return 10n;
  }

  async getDestinationEvents({
    startBlockHeight,
    endBlockHeight,
  }: { startBlockHeight: bigint; endBlockHeight: bigint }) {
    try {
      const events: any = [];

      const eventLogs = await this.getEventLogs({ startBlockHeight, endBlockHeight });
      const callMessageEventLogs = await this.filterCallMessageEventLogs(eventLogs);
      const callExecutedEventLogs = await this.filterCallExecutedEventLogs(eventLogs);

      callMessageEventLogs.forEach(eventLog => {
        events.push(this.parseCallMessageEventLog(eventLog, eventLog.transactionHash));
      });
      callExecutedEventLogs.forEach(eventLog => {
        events.push(this.parseCallExecutedEventLog(eventLog, eventLog.transactionHash));
      });

      return events;
    } catch (e) {
      console.log(e);
    }
    return null;
  }

  // TODO: deprecate
  async getDestinationEventsByBlock(blockHeight: bigint) {
    try {
      const events: any = [];

      const eventLogs = await this.getBlockEventLogs(blockHeight);
      const callMessageEventLogs = await this.filterCallMessageEventLogs(eventLogs);
      const callExecutedEventLogs = await this.filterCallExecutedEventLogs(eventLogs);

      callMessageEventLogs.forEach(eventLog => {
        events.push(this.parseCallMessageEventLog(eventLog, eventLog.transactionHash));
      });
      callExecutedEventLogs.forEach(eventLog => {
        events.push(this.parseCallExecutedEventLog(eventLog, eventLog.transactionHash));
      });

      return events;
    } catch (e) {
      console.log(e);
    }
    return null;
  }
}
