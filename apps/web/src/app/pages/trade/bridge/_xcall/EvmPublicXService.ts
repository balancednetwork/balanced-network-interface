import { Address, PublicClient, getContract, parseEventLogs } from 'viem';

import { XChainId } from '@/types';
import { AbstractPublicXService } from './types';
import {
  TransactionStatus,
  XCallEvent,
  XCallExecutedEvent,
  XCallMessageEvent,
  XCallMessageSentEvent,
} from '../_zustand/types';
import { xCallContractAbi } from './abis/xCallContractAbi';
import { xChainMap } from '../_config/xChains';
import { XCallEventType } from '../types';

const XCallEventSignatureMap = {
  [XCallEventType.CallMessageSent]: 'CallMessageSent',
  [XCallEventType.CallMessage]: 'CallMessage',
  [XCallEventType.CallExecuted]: 'CallExecuted',
};

export class EvmPublicXService extends AbstractPublicXService {
  xChainId: XChainId;
  publicClient: PublicClient;

  constructor(xChainId: XChainId, publicClient: PublicClient) {
    super();
    this.xChainId = xChainId;
    this.publicClient = publicClient;
  }

  getPublicClient() {
    return this.publicClient;
  }

  async getXCallFee(nid: XChainId, rollback: boolean, sources: string[] = []) {
    const contract = getContract({
      abi: xCallContractAbi,
      address: xChainMap[this.xChainId].contracts.xCall as Address,
      client: this.publicClient,
    });
    const fee = await contract.read.getFee([nid, rollback, sources]);
    return BigInt(fee);
  }

  async getBlockHeight() {
    const blockNumber = await this.publicClient.getBlockNumber();
    return blockNumber;
  }

  async getBlock(blockHeight: bigint) {
    const block = await this.publicClient.getBlock({ blockNumber: blockHeight });
    return block;
  }

  async getEventLogs({ startBlockHeight, endBlockHeight }: { startBlockHeight: bigint; endBlockHeight: bigint }) {
    const eventLogs = await this.publicClient.getLogs({
      fromBlock: startBlockHeight,
      toBlock: endBlockHeight,
      address: xChainMap[this.xChainId].contracts.xCall as Address,
    });

    const parsedLogs = parseEventLogs({
      abi: xCallContractAbi,
      logs: eventLogs,
    });

    return parsedLogs;
  }

  async getTxReceipt(txHash: string) {
    const tx = await this.publicClient.getTransactionReceipt({ hash: txHash as Address });
    return tx;
  }

  getTxEventLogs(rawTx) {
    return parseEventLogs({
      abi: xCallContractAbi,
      logs: rawTx?.logs,
    });
  }

  deriveTxStatus(rawTx): TransactionStatus {
    try {
      if (rawTx.transactionHash) {
        if (rawTx.status === 'success') {
          return TransactionStatus.success;
        } else {
          return TransactionStatus.failure;
        }
      }
    } catch (e) {}

    return TransactionStatus.pending;
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
    return eventLogs.filter(e => e.eventName === XCallEventSignatureMap[xCallEventType]);
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
      sn: eventLog.args._sn,
      from: eventLog.args._from,
      to: eventLog.args._to,
    };
  }
  _parseCallMessageEventLog(eventLog, txHash: string): XCallMessageEvent {
    return {
      eventType: XCallEventType.CallMessage,
      txHash,
      xChainId: this.xChainId,
      // rawEventData: eventLog,
      sn: eventLog.args._sn,
      reqId: eventLog.args._reqId,
      from: eventLog.args._from,
      to: eventLog.args._to,
      data: eventLog.args._data,
    };
  }
  _parseCallExecutedEventLog(eventLog, txHash: string): XCallExecutedEvent {
    return {
      eventType: XCallEventType.CallExecuted,
      xChainId: this.xChainId,
      txHash,
      // rawEventData: eventLog,
      reqId: eventLog.args._reqId,
      code: parseInt(eventLog.args._code),
      msg: eventLog.args._msg,
    };
  }
}
