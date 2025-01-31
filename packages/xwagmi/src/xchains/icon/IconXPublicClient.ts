import axios from 'axios';
import { BigNumber, Converter } from 'icon-sdk-js';
import bnJs from './bnJs';

import { XPublicClient } from '@/core/XPublicClient';
import { XToken } from '@/types';
import { sleep } from '@/utils';
import { CallData } from '@balancednetwork/balanced-js';
import { CurrencyAmount, XChainId } from '@balancednetwork/sdk-core';
import {
  TransactionStatus,
  XCallEvent,
  XCallEventType,
  XCallExecutedEvent,
  XCallMessageEvent,
  XCallMessageSentEvent,
  XTransactionInput,
} from '../../xcall/types';
import { IconXService } from './IconXService';
import { ICONTxResultType } from './types';

const getICONEventSignature = (eventName: XCallEventType): string => {
  const signatures = {
    [XCallEventType.CallMessage]: 'CallMessage(str,str,int,int,bytes)',
    [XCallEventType.CallExecuted]: 'CallExecuted(int,int,str)',
    [XCallEventType.CallMessageSent]: 'CallMessageSent(Address,str,int)',
    [XCallEventType.ResponseMessage]: 'ResponseMessage(int,int,str)',
    [XCallEventType.RollbackMessage]: 'RollbackMessage(int)',
  };

  return signatures[eventName] || 'none';
};

export class IconXPublicClient extends XPublicClient {
  getXService(): IconXService {
    return IconXService.getInstance();
  }

  getPublicClient() {
    return this.getXService().iconService;
  }

  async getBalance(address: string | undefined, xToken: XToken) {
    // not used
    return Promise.resolve(undefined);
  }

  async getBalances(address: string | undefined, xTokens: XToken[]): Promise<Record<string, CurrencyAmount<XToken>>> {
    if (!address) return {};

    const balances = {};

    const nativeXToken = xTokens.find(xToken => xToken.isNativeToken);
    const nonNativeXTokens = xTokens.filter(xToken => !xToken.isNativeToken);

    if (nativeXToken) {
      const balance = await bnJs.ICX.balanceOf(address).then(res => res.toFixed());
      balances[nativeXToken.address] = CurrencyAmount.fromRawAmount(nativeXToken, balance || 0);
    }

    const cds: CallData[] = nonNativeXTokens.map(token => {
      return {
        target: token.address,
        method: 'balanceOf',
        params: [address],
      };
    });

    const data: any[] = await bnJs.Multicall.getAggregateData(cds.filter(cd => cd.target.startsWith('cx')));

    return nonNativeXTokens.reduce((agg, token, idx) => {
      const balance = data[idx];

      if (balance) agg[token.address] = CurrencyAmount.fromRawAmount(token, String(balance));
      else agg[token.address] = CurrencyAmount.fromRawAmount(token, 0);

      return agg;
    }, balances);
  }

  async getXCallFee(xChainId: XChainId, nid: XChainId, rollback: boolean, sources?: string[]) {
    const res = await bnJs.XCall.getFee(nid, rollback, sources);
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
    return undefined;
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

  async getEventLogs(
    xChainId: XChainId,
    { startBlockHeight, endBlockHeight }: { startBlockHeight: bigint; endBlockHeight: bigint },
  ) {
    const url = `https://tracker.icon.community/api/v1/logs?block_start=${startBlockHeight}&block_end=${endBlockHeight}&address=${'cxa07f426062a1384bdd762afa6a87d123fbc81c75'}`;
    const res = await axios.get(url);

    if (res.status === 204) {
      return [];
    }

    const events = res.data;
    return events.map(({ data, indexed, transaction_hash, method, address, block_number }) => ({
      data: JSON.parse(data),
      indexed: JSON.parse(indexed),
      transactionHash: transaction_hash,
      method: method,
      scoreAddress: address,
      blockHeight: BigInt(block_number),
    }));
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

    return {
      eventType: XCallEventType.CallMessageSent,
      txHash,
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
      txHash,
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
      txHash,
      reqId: BigInt(parseInt(indexed[1], 16)),
      code: parseInt(data[0], 16),
      msg: data[1],
    };
  }

  needsApprovalCheck(xToken: XToken): boolean {
    return false;
  }

  async estimateApproveGas(amountToApprove: CurrencyAmount<XToken>, spender: string, owner: string) {
    return 0n;
  }

  async estimateSwapGas(xTransactionInput: XTransactionInput) {
    // TODO: implement
    return 0n;
  }
}
