import {
  Transaction,
  TransactionStatus,
  XCallEvent,
  XCallEventType,
  XCallMessageSentEvent,
  XTransactionInput,
} from '@/xwagmi/xcall/types';
import { Currency, CurrencyAmount, XChainId, XToken } from '@balancednetwork/sdk-core';

export interface IXPublicClient {
  // getBlock(blockHeight);
  getXCallFee(xChainId: XChainId, nid: XChainId, rollback: boolean, sources?: string[]): Promise<bigint>;
  getBlockHeight(): Promise<bigint>;
  getTxReceipt(txHash): Promise<any>;
  getTxEventLogs(rawTx): any[];
  deriveTxStatus(rawTx): TransactionStatus;

  getPublicClient(): any;

  getScanBlockCount(): bigint;
  getEventLogs(
    xChainId: XChainId,
    { startBlockHeight, endBlockHeight }: { startBlockHeight: bigint; endBlockHeight: bigint },
  ): Promise<any[]>;
  parseEventLogs(eventLogs: any[]): XCallEvent[];
  filterEventLogs(eventLogs: XCallEvent[], xCallEventType: XCallEventType): XCallEvent[];
  getCallMessageSentEvent(transaction: Transaction): XCallMessageSentEvent | null;
  getDestinationEvents(xChainId: XChainId, { startBlockHeight, endBlockHeight }): Promise<XCallEvent[] | null>;

  getBalance(address: string | undefined, xToken: XToken): Promise<CurrencyAmount<Currency> | undefined>;
  getBalances(address: string | undefined, xTokens: XToken[]): Promise<Record<string, CurrencyAmount<Currency>>>;

  estimateApprovalGas(): Promise<bigint>;
  estimateGas(xTransactionInput: XTransactionInput): Promise<bigint>;

  getTokenAllowance(
    owner: string | null | undefined,
    spender: string | undefined,
    xToken: XToken | undefined,
  ): Promise<bigint | undefined>;

  needsApprovalCheck(xToken: XToken): boolean;
}

export abstract class XPublicClient implements IXPublicClient {
  public xChainId: XChainId;

  constructor(xChainId: XChainId) {
    this.xChainId = xChainId;
  }

  abstract getXCallFee(xChainId: XChainId, nid: XChainId, rollback: boolean, sources?: string[]): Promise<bigint>;
  abstract getBlockHeight(): Promise<bigint>;
  abstract getTxReceipt(txHash): Promise<any>;
  abstract getTxEventLogs(rawTx): any[];
  abstract deriveTxStatus(rawTx): TransactionStatus;
  abstract getPublicClient();

  abstract getBalance(address: string | undefined, xToken: XToken): Promise<CurrencyAmount<XToken> | undefined>;
  async getBalances(address: string | undefined, xTokens: XToken[]): Promise<Record<string, CurrencyAmount<XToken>>> {
    if (!address) return {};

    const balancePromises = xTokens.map(async xToken => {
      const balance = await this.getBalance(address, xToken);
      return { symbol: xToken.symbol, address: xToken.address, balance };
    });

    const balances = await Promise.all(balancePromises);
    const tokenMap = balances.reduce((map, { address, balance }) => {
      if (balance) map[address] = balance;
      return map;
    }, {});

    return tokenMap;
  }

  abstract getEventLogs(
    xChainId: XChainId,
    { startBlockHeight, endBlockHeight }: { startBlockHeight: bigint; endBlockHeight: bigint },
  ): Promise<any[]>;
  abstract parseEventLogs(eventLogs: any[]): XCallEvent[];

  getScanBlockCount() {
    return 30n;
  }

  filterEventLogs(eventLogs: XCallEvent[], xCallEventType: XCallEventType) {
    return eventLogs.filter(x => x.eventType === xCallEventType);
  }

  getCallMessageSentEvent(sourceTransaction: Transaction) {
    try {
      const events = this.parseEventLogs(sourceTransaction.rawEventLogs || []);
      const callMessageSentEvent = this.filterEventLogs(events, XCallEventType.CallMessageSent)[0];
      return callMessageSentEvent as XCallMessageSentEvent;
    } catch (e) {
      console.error(e);
    }
    return null;
  }

  async getDestinationEvents(
    xChainId: XChainId,
    { startBlockHeight, endBlockHeight }: { startBlockHeight: bigint; endBlockHeight: bigint },
  ) {
    try {
      const eventLogs = await this.getEventLogs(xChainId, { startBlockHeight, endBlockHeight });
      const parsedEventsLogs = this.parseEventLogs(eventLogs);
      const events = [XCallEventType.CallMessage, XCallEventType.CallExecuted].flatMap(eventType =>
        this.filterEventLogs(parsedEventsLogs, eventType),
      );

      return events;
    } catch (e) {
      console.log(e);
    }
    return null;
  }

  async estimateApprovalGas() {
    return 0n;
  }

  async estimateGas(xTransactionInput: XTransactionInput) {
    return 0n;
  }

  // TODO: make this abstract?
  async getTokenAllowance(
    owner: string | null | undefined,
    spender: string | undefined,
    xToken: XToken | undefined,
  ): Promise<bigint | undefined> {
    return 0n;
  }

  abstract needsApprovalCheck(xToken: XToken): boolean;
}
