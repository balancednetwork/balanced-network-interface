import { Address, PublicClient, erc20Abi, getContract, parseEventLogs } from 'viem';

import { xChainMap } from '@/xwagmi/constants/xChains';
import { XPublicClient } from '@/xwagmi/core/XPublicClient';
import { XChainId, XToken } from '@/xwagmi/types';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import {
  TransactionStatus,
  XCallEvent,
  XCallEventType,
  XCallExecutedEvent,
  XCallMessageEvent,
  XCallMessageSentEvent,
} from '../../xcall/types';
import { EvmXService } from './EvmXService';
import { xCallContractAbi } from './abis/xCallContractAbi';

const XCallEventSignatureMap = {
  [XCallEventType.CallMessageSent]: 'CallMessageSent',
  [XCallEventType.CallMessage]: 'CallMessage',
  [XCallEventType.CallExecuted]: 'CallExecuted',
};

export class EvmXPublicClient extends XPublicClient {
  getXService(): EvmXService {
    return EvmXService.getInstance();
  }

  getChainId() {
    const xChain = xChainMap[this.xChainId];
    return xChain.id;
  }

  getPublicClient(): PublicClient {
    const publicClient = this.getXService().getPublicClient(this.getChainId());
    if (!publicClient) {
      throw new Error('EvmXPublicClient: publicClient is not initialized yet');
    }
    return publicClient;
  }

  async getBalance(address: string | undefined, xToken: XToken) {
    if (!address) return;

    if (xToken.isNativeXToken()) {
      const balance = await this.getPublicClient().getBalance({ address: address as Address });
      return CurrencyAmount.fromRawAmount(xToken, balance);
    } else {
      throw new Error(`Unsupported token: ${xToken.symbol}`);
    }
  }

  async getBalances(address: string | undefined, xTokens: XToken[]) {
    if (!address) return {};

    const balancePromises = xTokens
      .filter(xToken => xToken.isNativeXToken())
      .map(async xToken => {
        const balance = await this.getBalance(address, xToken);
        return { symbol: xToken.symbol, address: xToken.address, balance };
      });

    const balances = await Promise.all(balancePromises);
    const tokenMap = balances.reduce((map, { address, balance }) => {
      if (balance) map[address] = balance;
      return map;
    }, {});

    const nonNativeXTokens = xTokens.filter(xToken => !xToken.isNativeXToken());
    const result = await this.getPublicClient().multicall({
      contracts: nonNativeXTokens.map(token => ({
        abi: erc20Abi,
        address: token.address as `0x${string}`,
        functionName: 'balanceOf',
        args: [address],
        chainId: this.getChainId(),
      })),
    });

    return nonNativeXTokens
      .map((token, index) => CurrencyAmount.fromRawAmount(token, result[index].result?.toString() || '0'))
      .reduce((acc, balance) => {
        acc[balance.currency.wrapped.address] = balance;
        return acc;
      }, tokenMap);
  }

  async getXCallFee(xChainId: XChainId, nid: XChainId, rollback: boolean, sources: string[] = []) {
    const contract = getContract({
      abi: xCallContractAbi,
      address: xChainMap[xChainId].contracts.xCall as Address,
      client: this.getPublicClient(),
    });
    const fee = await contract.read.getFee([nid, rollback, sources]);
    return BigInt(fee);
  }

  async getBlockHeight() {
    const blockNumber = await this.getPublicClient().getBlockNumber();
    return blockNumber;
  }

  async getBlock(blockHeight: bigint) {
    const block = await this.getPublicClient().getBlock({ blockNumber: blockHeight });
    return block;
  }

  async getEventLogs(
    xChainId: XChainId,
    { startBlockHeight, endBlockHeight }: { startBlockHeight: bigint; endBlockHeight: bigint },
  ) {
    const eventLogs = await this.getPublicClient().getLogs({
      fromBlock: startBlockHeight,
      toBlock: endBlockHeight,
      address: xChainMap[xChainId].contracts.xCall as Address,
    });

    const parsedLogs = parseEventLogs({
      abi: xCallContractAbi,
      logs: eventLogs,
    });

    return parsedLogs;
  }

  async getTxReceipt(txHash: string) {
    const tx = await this.getPublicClient().getTransactionReceipt({ hash: txHash as Address });
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
      // xChainId: this.xChainId,
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
      // xChainId: this.xChainId,
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
      // xChainId: this.xChainId,
      txHash,
      // rawEventData: eventLog,
      reqId: eventLog.args._reqId,
      code: parseInt(eventLog.args._code),
      msg: eventLog.args._msg,
    };
  }
}
