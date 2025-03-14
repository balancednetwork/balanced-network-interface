import { fromBase64, toBase64 } from '@injectivelabs/sdk-ts';

import { injective } from '@/constants/xChains';
import { XPublicClient } from '@/core';
import { XToken } from '@/types';
import {
  TransactionStatus,
  XCallEvent,
  XCallEventType,
  XCallExecutedEvent,
  XCallMessageEvent,
  XCallMessageSentEvent,
  XTransactionInput,
} from '@/xcall/types';
import { CurrencyAmount, XChainId } from '@balancednetwork/sdk-core';
import { InjectiveXService } from './InjectiveXService';

const XCallEventSignatureMap = {
  [XCallEventType.CallMessageSent]: 'wasm-CallMessageSent',
  [XCallEventType.CallMessage]: 'wasm-CallMessage',
  [XCallEventType.CallExecuted]: 'wasm-CallExecuted',
};

export class InjectiveXPublicClient extends XPublicClient {
  getXService(): InjectiveXService {
    return InjectiveXService.getInstance();
  }

  getPublicClient() {
    // not used, just for XPublicClient abstract class
  }

  async getBalance(address: string | undefined, xToken: XToken) {
    if (!address) return;

    const xService = this.getXService();
    const portfolio = await xService.indexerGrpcAccountPortfolioApi.fetchAccountPortfolioBalances(address);

    const xTokenAddress = xToken.address;

    const balance = portfolio.bankBalancesList.find(_balance => _balance.denom === xTokenAddress);
    if (balance) {
      return CurrencyAmount.fromRawAmount(xToken, BigInt(balance.amount));
    }

    return undefined;
  }

  async getXCallFee(xChainId: XChainId, nid: XChainId, rollback: boolean) {
    const response: any = await this.getXService().chainGrpcWasmApi.fetchSmartContractState(
      injective.contracts.xCall,
      toBase64({ get_fee: { nid: nid, rollback } }),
    );

    const fee: any = fromBase64(response.data);
    return BigInt(fee);
  }

  async getBlockHeight() {
    const blocks = await this.getXService().indexerGrpcExplorerApi.fetchBlocks({
      limit: 1,
    });
    const lastBlock = blocks.data[0];

    return BigInt(lastBlock.height);
  }

  async getTxReceipt(txHash) {
    const tx = await this.getXService().indexerRestExplorerApi.fetchTransaction(txHash);

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

  getScanBlockCount() {
    return 30n;
  }

  async getEventLogs(
    xChainId: XChainId,
    { startBlockHeight, endBlockHeight }: { startBlockHeight: bigint; endBlockHeight: bigint },
  ) {
    const allTransactions: any[] = [];

    let skip = 0;
    const limit = 100;
    while (true) {
      const txs = await this.getXService().indexerRestExplorerApi.fetchTransactions({
        after: Number(startBlockHeight),
        before: Number(endBlockHeight),
        limit,
        skip,
      });
      allTransactions.push(...txs.transactions);

      if (txs.paging.total <= skip + limit) {
        break;
      }

      skip = skip + limit;
    }

    // txs is an array of tx, each tx has events, which is an array of event, return all events merged
    const events = allTransactions
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
      txHash,
      from: eventLog.attributes.find(attr => attr.key === 'from')?.value,
      to: eventLog.attributes.find(attr => attr.key === 'to')?.value,
      sn: BigInt(eventLog.attributes.find(attr => attr.key === 'sn')?.value),
    };
  }

  _parseCallMessageEventLog(eventLog, txHash: string): XCallMessageEvent {
    return {
      eventType: XCallEventType.CallMessage,
      txHash,
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
      txHash,
      reqId: BigInt(eventLog.attributes.find(attr => attr.key === 'reqId')?.value),
      code: parseInt(eventLog.attributes.find(attr => attr.key === 'code')?.value),
      msg: eventLog.attributes.find(attr => attr.key === 'msg')?.value,
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
