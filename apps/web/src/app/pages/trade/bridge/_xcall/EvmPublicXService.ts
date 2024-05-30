import { Address, PublicClient, parseEventLogs } from 'viem';

import { XCallEventType, XChainId } from 'app/pages/trade/bridge/types';
import { AbstractPublicXService } from './types';
import { TransactionStatus, XCallDestinationEvent, XCallEvent, XCallSourceEvent } from '../_zustand/types';
import { xCallContractAbi } from './abis/xCallContractAbi';

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

  // TODO: complete this
  getXCallFee(to: XChainId, rollback: boolean) {
    return Promise.resolve({
      rollback: 0n,
      noRollback: 0n,
    });
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
      // fromBlock: 45272443n,
      // toBlock: 45272459n,
      // address: avalanche.contracts.xCall as Address, // TODO: is it right?
      // TODO: need to add more filters?
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

  filterEventLogs(eventLogs, xCallEventType: XCallEventType) {
    return eventLogs.filter(e => e.eventName === XCallEventSignatureMap[xCallEventType]);
  }

  parseEventLog(eventLog: any, txHash: string, eventType: XCallEventType): XCallEvent {
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
    const sn = eventLog.args._sn;

    return {
      eventType: XCallEventType.CallMessageSent,
      sn: sn,
      xChainId: this.xChainId,
      rawEventData: eventLog,
      txHash,
    };
  }
  _parseCallMessageEventLog(eventLog, txHash: string): XCallDestinationEvent {
    const sn = eventLog.args._sn;
    const reqId = eventLog.args._reqId;

    return {
      eventType: XCallEventType.CallMessage,
      sn: sn,
      reqId,
      xChainId: this.xChainId,
      rawEventData: eventLog,
      txHash,
      isSuccess: true,
    };
  }
  _parseCallExecutedEventLog(eventLog, txHash: string): XCallDestinationEvent {
    const reqId = eventLog.args._reqId;

    return {
      eventType: XCallEventType.CallExecuted,
      sn: -1n,
      reqId,
      xChainId: this.xChainId,
      rawEventData: eventLog,
      txHash,
      isSuccess: true,
    };
  }
}
