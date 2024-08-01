import { IndexerGrpcAccountPortfolioApi, IndexerRestExplorerApi } from '@injectivelabs/sdk-ts';
import { getNetworkEndpoints, Network } from '@injectivelabs/networks';
import { IndexerGrpcExplorerApi } from '@injectivelabs/sdk-ts';

import { injective } from 'app/pages/trade/bridge/_config/xChains';

import { XCallEventType, XChainId } from 'app/pages/trade/bridge/types';
import { AbstractPublicXService } from './types';
import {
  TransactionStatus,
  XCallEvent,
  XCallExecutedEvent,
  XCallMessageEvent,
  XCallMessageSentEvent,
} from '../_zustand/types';

const XCallEventSignatureMap = {
  [XCallEventType.CallMessageSent]: 'wasm-CallMessageSent',
  [XCallEventType.CallMessage]: 'wasm-CallMessage',
  [XCallEventType.CallExecuted]: 'wasm-CallExecuted',
};

const endpoints = getNetworkEndpoints(Network.Mainnet);

export class InjectivePublicXService extends AbstractPublicXService {
  xChainId: XChainId;
  publicClient: any;
  indexerGrpcExplorerApi: IndexerGrpcExplorerApi;
  indexerRestExplorerApi: IndexerRestExplorerApi;

  constructor(xChainId: XChainId, publicClient: any) {
    super();
    this.xChainId = xChainId;
    this.publicClient = publicClient;

    // this.indexerGrpcAccountPortfolioApi = new IndexerGrpcAccountPortfolioApi(endpoints.indexer);
    this.indexerGrpcExplorerApi = new IndexerGrpcExplorerApi(endpoints.explorer);
    this.indexerRestExplorerApi = new IndexerRestExplorerApi(`${endpoints.explorer}/api/explorer/v1`);
  }

  getPublicClient() {
    return this.publicClient;
  }

  // TODO: complete this
  async getXCallFee(nid: XChainId, rollback: boolean) {
    const fee = await this.publicClient.queryContractSmart(injective.contracts.xCall, {
      get_fee: { nid: nid, rollback },
    });
    return BigInt(fee);
  }

  async getBlockHeight() {
    const blocks = await this.indexerGrpcExplorerApi.fetchBlocks({
      limit: 1,
    });
    const lastBlock = blocks.data[0];

    return BigInt(lastBlock.height);
  }

  async getBlock(blockHeight: bigint) {
    const block = await this.indexerGrpcExplorerApi.fetchBlock(blockHeight.toString());
    return block;
  }

  async getTxReceipt(txHash) {
    // const tx = await this.indexerGrpcExplorerApi.fetchTxByHash(txHash);
    const tx = await this.indexerRestExplorerApi.fetchTransaction(txHash);

    return tx;
  }

  getTxEventLogs(rawTx) {
    return rawTx?.logs?.[0]['events'];
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
    // const txs = await this.indexerGrpcExplorerApi.fetchTxs({
    //   after: Number(startBlockHeight),
    //   before: Number(endBlockHeight),
    //   limit: 100,
    // });
    const txs = await this.indexerRestExplorerApi.fetchTransactions({
      after: Number(startBlockHeight),
      before: Number(endBlockHeight),
      limit: 100,
    });

    console.log('txs', txs);

    // txs is an array of tx, each tx has events, which is an array of event, return all events merged
    const events = txs.transactions
      .flatMap(tx => tx.logs?.[0]['events'].map(e => ({ ...e, transactionHash: tx.hash })))
      .filter(e => e);

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

  _parseCallMessageSentEventLog(eventLog, txHash: string): XCallMessageSentEvent {
    return {
      eventType: XCallEventType.CallMessageSent,
      xChainId: this.xChainId,
      txHash,
      // rawEventData: eventLog,
      from: eventLog.attributes.find(attr => attr.key === 'from')?.value,
      to: eventLog.attributes.find(attr => attr.key === 'to')?.value,
      sn: BigInt(eventLog.attributes.find(attr => attr.key === 'sn')?.value),
    };
  }
  _parseCallMessageEventLog(eventLog, txHash: string): XCallMessageEvent {
    return {
      eventType: XCallEventType.CallMessage,
      xChainId: this.xChainId,
      txHash,
      // rawEventData: eventLog,
      from: eventLog.attributes.find(attr => attr.key === 'from')?.value,
      to: eventLog.attributes.find(attr => attr.key === 'to')?.value,
      sn: BigInt(eventLog.attributes.find(attr => attr.key === 'sn')?.value),
      reqId: BigInt(eventLog.attributes.find(attr => attr.key === 'reqId')?.value),
      data: eventLog.attributes.find(attr => attr.key === 'data')?.value,
    };
  }
  _parseCallExecutedEventLog(eventLog, txHash: string): XCallExecutedEvent {
    const reqId = eventLog.attributes.find(a => a.key === 'reqId')?.value;

    return {
      eventType: XCallEventType.CallExecuted,
      xChainId: this.xChainId,
      txHash,
      // rawEventData: eventLog,
      reqId: BigInt(eventLog.attributes.find(attr => attr.key === 'reqId')?.value),
      code: parseInt(eventLog.attributes.find(attr => attr.key === 'code')?.value),
      msg: eventLog.attributes.find(attr => attr.key === 'msg')?.value,
    };
  }
}
