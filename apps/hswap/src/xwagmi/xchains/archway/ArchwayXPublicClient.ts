import { ArchwayClient } from '@archwayhq/arch3.js';

import { archway } from '@/xwagmi/constants/xChains';

import { XPublicClient } from '@/xwagmi/core/XPublicClient';
import { XChainId, XToken } from '@balancednetwork/sdk-core';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import {
  TransactionStatus,
  XCallEvent,
  XCallEventType,
  XCallExecutedEvent,
  XCallMessageEvent,
  XCallMessageSentEvent,
} from '../../xcall/types';
import { ArchwayXService } from './ArchwayXService';
import { ARCHWAY_FEE_TOKEN_SYMBOL } from './constants';
import { isDenomAsset } from './utils';

const XCallEventSignatureMap = {
  [XCallEventType.CallMessageSent]: 'wasm-CallMessageSent',
  [XCallEventType.CallMessage]: 'wasm-CallMessage',
  [XCallEventType.CallExecuted]: 'wasm-CallExecuted',
};

export class ArchwayXPublicClient extends XPublicClient {
  getXService(): ArchwayXService {
    return ArchwayXService.getInstance();
  }

  getPublicClient(): ArchwayClient {
    const publicClient = this.getXService().publicClient;
    if (!publicClient) {
      throw new Error('ArchwayXPublicClient: publicClient is not initialized yet');
    }
    return publicClient;
  }

  async getBalance(address: string | undefined, xToken: XToken) {
    if (!address) return;

    if (xToken.isNativeXToken()) {
      const archTokenBalance = await this.getPublicClient().getBalance(address, ARCHWAY_FEE_TOKEN_SYMBOL);
      return CurrencyAmount.fromRawAmount(xToken, archTokenBalance.amount || 0);
    } else if (isDenomAsset(xToken)) {
      const nativeBalance = await this.getPublicClient().getBalance(address, xToken.address);
      return CurrencyAmount.fromRawAmount(xToken, nativeBalance.amount || 0);
    } else if (!isDenomAsset(xToken)) {
      const balance = await this.getPublicClient().queryContractSmart(xToken.address, { balance: { address } });
      return CurrencyAmount.fromRawAmount(xToken, balance.balance);
    } else {
      throw new Error(`Unsupported token: ${xToken.symbol}`);
    }
  }

  async getXCallFee(xChainId: XChainId, nid: XChainId, rollback: boolean) {
    const fee = await this.getPublicClient().queryContractSmart(archway.contracts.xCall, {
      get_fee: { nid: nid, rollback },
    });
    return BigInt(fee);
  }

  async getBlockHeight() {
    const height = await this.getPublicClient().getHeight();
    return BigInt(height);
  }

  async getBlock(blockHeight: bigint) {
    const block = await this.getPublicClient().getBlock(Number(blockHeight));
    return block;
  }

  async getTxReceipt(txHash) {
    const tx = await this.getPublicClient().getTx(txHash);
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

  async getEventLogs(
    xChainId: XChainId,
    { startBlockHeight, endBlockHeight }: { startBlockHeight: bigint; endBlockHeight: bigint },
  ) {
    let txs;

    // TODO: is 10 iterations enough?
    for (let i = 0; i < 10; i++) {
      txs = await this.getPublicClient().searchTx(`tx.height>=${startBlockHeight} AND tx.height<=${endBlockHeight}`);

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

  _parseCallMessageSentEventLog(eventLog, txHash: string): XCallMessageSentEvent {
    return {
      eventType: XCallEventType.CallMessageSent,
      // xChainId: this.xChainId,
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
      // xChainId: this.xChainId,
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
      // xChainId: this.xChainId,
      txHash,
      // rawEventData: eventLog,
      reqId: BigInt(eventLog.attributes.find(attr => attr.key === 'reqId')?.value),
      code: parseInt(eventLog.attributes.find(attr => attr.key === 'code')?.value),
      msg: eventLog.attributes.find(attr => attr.key === 'msg')?.value,
    };
  }
}
