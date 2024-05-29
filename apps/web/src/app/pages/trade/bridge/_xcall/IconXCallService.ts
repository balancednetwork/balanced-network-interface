import bnJs from 'bnJs';
import IconService, { Converter, BigNumber } from 'icon-sdk-js';
import { Percent, Token } from '@balancednetwork/sdk-core';

import { showMessageOnBeforeUnload } from 'utils/messages';
import { toDec } from 'utils';
import { NETWORK_ID } from 'constants/config';

import { CROSS_TRANSFER_TOKENS } from 'app/pages/trade/bridge/_config/xTokens';
import { XCallEventType, XChainId } from 'app/pages/trade/bridge/types';
import {
  XTransactionInput,
  Transaction,
  TransactionStatus,
  XCallDestinationEvent,
  XCallEvent,
  XCallEventMap,
} from '../_zustand/types';
import { fetchTxResult } from 'app/_xcall/_icon/utils';
import { XCallService } from './types';

export const getICONEventSignature = (eventName: XCallEventType) => {
  switch (eventName) {
    case XCallEventType.CallMessage: {
      return 'CallMessage(str,str,int,int,bytes)';
    }
    case XCallEventType.CallExecuted: {
      return 'CallExecuted(int,int,str)';
    }
    case XCallEventType.CallMessageSent: {
      return 'CallMessageSent(Address,str,int)';
    }
    case XCallEventType.ResponseMessage: {
      return 'ResponseMessage(int,int,str)';
    }
    case XCallEventType.RollbackMessage: {
      return 'RollbackMessage(int)';
    }
    default:
      return 'none';
  }
};

export class IconXCallService implements XCallService {
  xChainId: XChainId;
  publicClient: IconService;
  walletClient: IconService; // reserved for future use
  changeShouldLedgerSign: any;

  constructor(xChainId: XChainId, serviceConfig: any) {
    const { publicClient, walletClient, changeShouldLedgerSign } = serviceConfig;
    this.xChainId = xChainId;
    this.publicClient = publicClient;
    this.walletClient = walletClient;
    this.changeShouldLedgerSign = changeShouldLedgerSign;
  }

  async getXCallFee(to: XChainId, rollback: boolean) {
    return Promise.resolve({
      rollback: 0n,
      noRollback: 0n,
    });
  }
  async getBlockHeight() {
    const lastBlock = await this.publicClient.getLastBlock().execute();
    return BigInt(lastBlock.height);
  }
  async getBlock(blockHeight: bigint) {
    const block = await this.publicClient.getBlockByHeight(new BigNumber(blockHeight.toString())).execute();
    return block;
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

  async getTxReceipt(txHash: string) {
    //TODO: update to use this.publicClient
    return await fetchTxResult(txHash);
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

  filterEventLogs(eventLogs, sig, address = null) {
    return eventLogs.filter(event => {
      return event.indexed && event.indexed[0] === sig && (!address || address === event.scoreAddress);
    });
  }

  filterCallMessageSentEventLog(eventLogs: any[]) {
    const signature = getICONEventSignature(XCallEventType.CallMessageSent);
    return eventLogs.find(event => event.indexed.includes(signature));
  }

  filterCallMessageEventLogs(eventLogs: any[]) {
    const signature = getICONEventSignature(XCallEventType.CallMessage);
    return this.filterEventLogs(eventLogs, signature);
  }

  filterCallExecutedEventLogs(eventLogs: any[]) {
    const signature = getICONEventSignature(XCallEventType.CallExecuted);
    return this.filterEventLogs(eventLogs, signature);
  }

  parseCallMessageSentEventLog(eventLog, txHash: string): XCallEvent {
    const sn = parseInt(eventLog.indexed[3], 16);

    return {
      eventType: XCallEventType.CallMessageSent,
      sn: BigInt(sn),
      xChainId: this.xChainId,
      rawEventData: eventLog,
      txHash,
    };
  }
  parseCallMessageEventLog(eventLog, txHash: string): XCallDestinationEvent {
    const sn = parseInt(eventLog.indexed[3], 16);
    const reqId = parseInt(eventLog.data[0], 16);

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
    const reqId = parseInt(eventLog.indexed[1], 16);
    // TODO: check for success?
    // const success = eventLog.data[0] === '0x1';

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

  async getSourceEvents(sourceTransaction: Transaction): Promise<XCallEventMap> {
    const callMessageSentLog = this.filterCallMessageSentEventLog(sourceTransaction.rawEventLogs || []);
    if (callMessageSentLog) {
      return {
        [XCallEventType.CallMessageSent]: this.parseCallMessageSentEventLog(callMessageSentLog, sourceTransaction.hash),
      };
    }

    return {};
  }

  getScanBlockCount() {
    return 1n;
  }

  async getDestinationEvents({
    startBlockHeight,
    endBlockHeight,
  }: { startBlockHeight: bigint; endBlockHeight: bigint }) {
    let events: any = [];

    for (let i = startBlockHeight; i <= endBlockHeight; i++) {
      const blockEvents = await this.getDestinationEventsByBlock(i);

      if (!blockEvents) {
        return null;
      }
      events = events.concat(blockEvents);
    }

    return events;
  }

  async getDestinationEventsByBlock(blockHeight: bigint) {
    const events: any = [];
    try {
      const eventLogs = await this.getBlockEventLogs(blockHeight);

      const callMessageEventLogs = this.filterCallMessageEventLogs(eventLogs);
      const callExecutedEventLogs = this.filterCallExecutedEventLogs(eventLogs);

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

  async approve(token, owner, spender, currencyAmountToApprove) {}

  async executeTransfer(xSwapInfo: XTransactionInput) {
    const {
      direction,
      inputAmount,
      recipient: destinationAddress,
      account,
      xCallFee,
      isLiquidFinanceEnabled,
    } = xSwapInfo;

    if (account && xCallFee) {
      window.addEventListener('beforeunload', showMessageOnBeforeUnload);

      if (bnJs.contractSettings.ledgerSettings.actived && this.changeShouldLedgerSign) {
        this.changeShouldLedgerSign(true);
      }

      const tokenAddress = inputAmount.wrapped.currency.address;
      const destination = `${direction.to}/${destinationAddress}`;

      let txResult;
      if (CROSS_TRANSFER_TOKENS.includes(inputAmount.currency.symbol)) {
        const cx = bnJs.inject({ account }).getContract(tokenAddress);
        txResult = await cx.crossTransfer(destination, `${inputAmount.quotient}`, xCallFee.rollback.toString());
      } else {
        txResult = await bnJs
          .inject({ account })
          .AssetManager[isLiquidFinanceEnabled ? 'withdrawNativeTo' : 'withdrawTo'](
            `${inputAmount.quotient}`,
            tokenAddress,
            destination,
            xCallFee.rollback.toString(),
          );
      }

      const { result: hash } = txResult || {};

      if (hash) {
        return hash;
      }
    }
  }

  async executeSwap(xSwapInfo: XTransactionInput) {
    const { executionTrade, account, direction, recipient, slippageTolerance } = xSwapInfo;

    if (!executionTrade || !slippageTolerance) {
      return;
    }

    const minReceived = executionTrade.minimumAmountOut(new Percent(slippageTolerance, 10_000));
    const receiver = `${direction.to}/${recipient}`;

    window.addEventListener('beforeunload', showMessageOnBeforeUnload);
    if (bnJs.contractSettings.ledgerSettings.actived && this.changeShouldLedgerSign) {
      this.changeShouldLedgerSign(true);
    }

    let txResult;
    if (executionTrade.inputAmount.currency.symbol === 'ICX') {
      txResult = await bnJs
        .inject({ account })
        .Router.swapICX(
          toDec(executionTrade.inputAmount),
          executionTrade.route.pathForSwap,
          NETWORK_ID === 1 ? toDec(minReceived) : '0x0',
          receiver,
        );
    } else {
      const inputToken = executionTrade.inputAmount.currency.wrapped;
      const outputToken = executionTrade.outputAmount.currency.wrapped;

      const cx = bnJs.inject({ account }).getContract(inputToken.address);

      txResult = await cx.swapUsingRoute(
        toDec(executionTrade.inputAmount),
        outputToken.address,
        toDec(minReceived),
        executionTrade.route.pathForSwap,
        receiver,
      );
    }

    const { result: hash } = txResult || {};
    if (hash) {
      return hash;
    }
  }
}
