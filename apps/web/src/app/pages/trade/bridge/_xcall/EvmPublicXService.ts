import { Address, PublicClient, parseEventLogs } from 'viem';

import { XCallEventType, XChainId } from 'app/pages/trade/bridge/types';
import { IPublicXService } from './types';
import { Transaction, TransactionStatus, XCallDestinationEvent, XCallSourceEvent } from '../_zustand/types';
import { xCallContractAbi } from './abis/xCallContractAbi';

export class EvmPublicXService implements IPublicXService {
  xChainId: XChainId;
  publicClient: PublicClient;

  constructor(xChainId: XChainId, publicClient: PublicClient) {
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

  async getBlockEventLogs(blockHeight: bigint) {
    const eventLogs = await this.publicClient.getLogs({
      fromBlock: blockHeight,
      toBlock: blockHeight,
      // fromBlock: 45272443n,
      // toBlock: 45272459n,
      // address: avalanche.contracts.xCall as Address, // TODO: is it right?
      // TODO: need to add more filters?
    });

    // const parsedLogs = parseEventLogs({
    //   abi: xCallContractAbi,
    //   logs: eventLogs,
    // });

    // console.log(parsedLogs);

    return eventLogs;
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

    // const parsedLogs = parseEventLogs({
    //   abi: xCallContractAbi,
    //   logs: eventLogs,
    // });

    // console.log(parsedLogs);

    return eventLogs;
  }

  async getTxReceipt(txHash: string) {
    const tx = await this.publicClient.getTransactionReceipt({ hash: txHash as Address });
    return tx;
  }

  getTxEventLogs(rawTx) {
    return rawTx?.logs;
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

  parseCallMessageSentEventLog(eventLog, txHash: string): XCallSourceEvent {
    const sn = eventLog.args._sn;

    return {
      eventType: XCallEventType.CallMessageSent,
      sn: sn,
      xChainId: this.xChainId,
      rawEventData: eventLog,
      txHash,
    };
  }
  parseCallMessageEventLog(eventLog, txHash: string): XCallDestinationEvent {
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
  parseCallExecutedEventLog(eventLog, txHash: string): XCallDestinationEvent {
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

  filterEventLogs(eventLogs, signature) {
    return eventLogs.filter(e => e.eventName === signature);
  }

  filterCallMessageSentEventLog(eventLogs) {
    const eventFiltered = eventLogs.find(e => e.eventName === 'CallMessageSent');
    return eventFiltered;
  }

  filterCallMessageEventLogs(eventLogs) {
    const eventFiltered = this.filterEventLogs(eventLogs, 'CallMessage');
    return eventFiltered;
  }

  filterCallExecutedEventLogs(eventLogs) {
    const eventFiltered = this.filterEventLogs(eventLogs, 'CallExecuted');
    return eventFiltered;
  }

  async getSourceEvents(sourceTransaction: Transaction) {
    try {
      if (!sourceTransaction.rawEventLogs) {
        return {};
      }
      const parsedLogs = parseEventLogs({
        abi: xCallContractAbi,
        logs: sourceTransaction.rawEventLogs,
      });

      const callMessageSentEventLog = this.filterCallMessageSentEventLog(parsedLogs);
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
    const events: any = [];
    try {
      const eventLogs = await this.getEventLogs({ startBlockHeight, endBlockHeight });
      const parsedLogs = parseEventLogs({
        abi: xCallContractAbi,
        logs: eventLogs,
      });

      const callMessageEventLogs = this.filterCallMessageEventLogs(parsedLogs);
      const callExecutedEventLogs = this.filterCallExecutedEventLogs(parsedLogs);

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

  async getDestinationEventsByBlock(blockHeight) {
    const events: any = [];
    try {
      const eventLogs = await this.getBlockEventLogs(blockHeight);
      const parsedLogs = parseEventLogs({
        abi: xCallContractAbi,
        logs: eventLogs,
      });

      const callMessageEventLogs = this.filterCallMessageEventLogs(parsedLogs);
      const callExecutedEventLogs = this.filterCallExecutedEventLogs(parsedLogs);

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
