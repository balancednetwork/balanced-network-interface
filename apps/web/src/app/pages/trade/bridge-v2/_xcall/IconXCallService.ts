import bnJs from 'bnJs';
import { showMessageOnBeforeUnload } from 'utils/messages';

import {
  BridgeInfo,
  BridgeTransfer,
  BridgeTransferStatus,
  TransactionStatus,
  XCallEvent,
  XCallEventMap,
} from '../_zustand/types';
import { bridgeTransferActions } from '../_zustand/useBridgeTransferStore';
import { transactionActions } from '../_zustand/useTransactionStore';

import { ASSET_MANAGER_TOKENS, CROSS_TRANSFER_TOKENS } from 'app/_xcall/config';

import { iconService } from 'app/_xcall/_icon/utils';
import { XCallEventType, XChainId } from 'app/_xcall/types';

import { fetchTxResult } from 'app/_xcall/_icon/utils';
import { XCallService } from './types';
import { Converter } from 'icon-sdk-js';

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
  iconService: any;
  changeShouldLedgerSign: any;

  constructor(xChainId: XChainId, serviceConfig: any) {
    const { iconService, changeShouldLedgerSign } = serviceConfig;
    this.xChainId = xChainId;
    this.iconService = iconService;
    this.changeShouldLedgerSign = changeShouldLedgerSign;
  }

  async fetchXCallFee(to: XChainId, rollback: boolean) {
    return Promise.resolve({
      rollback: 0n,
      noRollback: 0n,
    });
  }

  async fetchBlockHeight() {
    const lastBlock = await iconService.getLastBlock().execute();
    return BigInt(lastBlock.height);
  }

  async getBlock(blockHeight: number) {
    const block = await this.iconService.getBlockByHeight(blockHeight).execute();
    return block;
  }

  async getTx(txHash: string) {
    return await fetchTxResult(txHash);
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

  filterEventLog(eventLogs, sig, address = null) {
    const result = eventLogs.find(event => {
      return event.indexed && event.indexed[0] === sig && (!address || address === event.scoreAddress);
    });

    return result;
  }

  filterCallMessageSentEventLog(eventLogs) {
    const signature = getICONEventSignature(XCallEventType.CallMessageSent);
    return eventLogs.find(event => event.indexed.includes(signature));
  }

  filterCallMessageEventLog(eventLogs) {
    const signature = getICONEventSignature(XCallEventType.CallMessage);
    return this.filterEventLog(eventLogs, signature);
  }

  filterCallExecutedEventLog(eventLogs) {
    const signature = getICONEventSignature(XCallEventType.CallExecuted);
    return this.filterEventLog(eventLogs, signature);
  }

  parseCallMessageSentEventLog(eventLog) {
    const sn = parseInt(eventLog.indexed[3], 16);

    return {
      eventType: XCallEventType.CallMessageSent,
      sn,
      xChainId: this.xChainId,
      rawEventData: eventLog,
    };
  }
  parseCallMessageEventLog(eventLog) {
    const sn = parseInt(eventLog.indexed[3], 16);
    const reqId = parseInt(eventLog.indexed[1], 16);

    return {
      eventType: XCallEventType.CallMessage,
      sn,
      reqId,
      xChainId: this.xChainId,
      rawEventData: eventLog,
    };
  }
  parseCallExecutedEventLog(eventLog) {
    const reqId = parseInt(eventLog.indexed[1], 16);

    return {
      eventType: XCallEventType.CallExecuted,
      sn: -1,
      reqId,
      xChainId: this.xChainId,
      rawEventData: eventLog,
    };
  }

  async fetchSourceEvents(transfer: BridgeTransfer): Promise<XCallEventMap> {
    const rawTx = transfer.sourceTransaction.rawTx;

    const callMessageSentLog = this.filterCallMessageSentEventLog(rawTx?.eventLogs || []);
    if (callMessageSentLog) {
      return {
        [XCallEventType.CallMessageSent]: this.parseCallMessageSentEventLog(callMessageSentLog),
      };
    }

    return {};
  }

  async fetchDestinationEventsByBlock(blockHeight) {
    const events: any = [];

    const block = await this.getBlock(blockHeight);

    if (block && block.txs.length > 0) {
      for (const tx of block.confirmedTransactionList) {
        const txResult = await this.getTx(tx.txHash);

        const callMessageEventLog = this.filterCallMessageEventLog(txResult?.eventLogs || []);
        const callExecutedEventLog = this.filterCallExecutedEventLog(txResult?.eventLogs || []);

        if (callMessageEventLog) {
          events.push(this.parseCallMessageEventLog(callMessageEventLog));
        }
        if (callExecutedEventLog) {
          events.push(this.parseCallExecutedEventLog(callExecutedEventLog));
        }
      }
    } else {
      return null;
    }
    return events;
  }

  async executeTransfer(bridgeInfo: BridgeInfo) {
    const {
      bridgeDirection,
      currencyAmountToBridge,
      recipient: destinationAddress,
      account,
      xCallFee,
      isLiquidFinanceEnabled,
    } = bridgeInfo;

    if (account && xCallFee) {
      window.addEventListener('beforeunload', showMessageOnBeforeUnload);

      if (bnJs.contractSettings.ledgerSettings.actived && this.changeShouldLedgerSign) {
        this.changeShouldLedgerSign(true);
      }

      const tokenAddress = currencyAmountToBridge.wrapped.currency.address;
      const destination = `${bridgeDirection.to}/${destinationAddress}`;

      let txResult;
      if (CROSS_TRANSFER_TOKENS.includes(currencyAmountToBridge.currency.symbol!)) {
        const cx = bnJs.inject({ account }).getContract(tokenAddress);
        txResult = await cx.crossTransfer(
          destination,
          `${currencyAmountToBridge.quotient}`,
          xCallFee.rollback.toString(),
        );
      } else if (ASSET_MANAGER_TOKENS.includes(currencyAmountToBridge.currency.symbol || '')) {
        try {
          txResult = await bnJs
            .inject({ account })
            .AssetManager[isLiquidFinanceEnabled ? 'withdrawNativeTo' : 'withdrawTo'](
              `${currencyAmountToBridge.quotient}`,
              tokenAddress,
              destination,
              xCallFee.rollback.toString(),
            );
        } catch (e) {
          console.log(e);
        }
      }

      const { result: hash } = txResult || {};
      console.log('hash', hash);

      if (hash) {
        bridgeTransferActions.setIsTransferring(true);
        const transaction = transactionActions.add(bridgeDirection.from, {
          hash,
          pendingMessage: 'Requesting cross-chain transfer...',
          successMessage: 'Cross-chain transfer requested.',
          errorMessage: 'Cross-chain transfer failed.',
        });

        return {
          id: `${this.xChainId}/${hash}`,
          bridgeInfo,
          sourceTransaction: transaction,
          status: BridgeTransferStatus.TRANSFER_REQUESTED,
          events: {},
          destinationChainInitialBlockHeight: -1n,
        };
      }
    }
    return null;
  }
}
