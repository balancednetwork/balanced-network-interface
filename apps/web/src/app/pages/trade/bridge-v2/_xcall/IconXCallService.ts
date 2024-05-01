import bnJs from 'bnJs';
import { showMessageOnBeforeUnload } from 'utils/messages';

import { BridgeInfo, BridgeTransfer, BridgeTransferStatus, XCallEventMap } from '../_zustand/types';
import { bridgeTransferActions } from '../_zustand/useBridgeTransferStore';
import { transactionActions } from '../_zustand/useTransactionStore';

import { ASSET_MANAGER_TOKENS, CROSS_TRANSFER_TOKENS } from 'app/_xcall/config';

import { iconService } from 'app/_xcall/_icon/utils';
import { XCallEventType, XChainId } from 'app/_xcall/types';
import { xChainMap } from 'app/_xcall/archway/config1';

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
  iconService: any;
  changeShouldLedgerSign: any;

  constructor(xChainId: XChainId, iconService, changeShouldLedgerSign) {
    this.xChainId = xChainId;
    this.iconService = iconService;
    this.changeShouldLedgerSign = changeShouldLedgerSign;
  }

  async fetchXCallFee(to: XChainId, rollback: boolean) {
    return await bnJs.XCall.getFee(xChainMap[to].xChainId, rollback);
  }

  async fetchBlockHeight() {
    const lastBlock = await iconService.getLastBlock().execute();
    return lastBlock.height;
  }

  getCallMessageSentEventFromLogs(logs) {
    return logs.find(event => event.indexed.includes(getICONEventSignature(XCallEventType.CallMessageSent)));
  }

  async fetchSourceEvents(transfer: BridgeTransfer): Promise<XCallEventMap> {
    console.log('fetchSourceEvents executed');
    const transaction = transfer.transactions[0];
    const hash = transaction.hash;
    const txResult = await fetchTxResult(hash);

    if (txResult?.status === 1 && txResult.eventLogs.length) {
      const callMessageSentLog = this.getCallMessageSentEventFromLogs(txResult.eventLogs);
      const sn = parseInt(callMessageSentLog.indexed[3], 16);

      return {
        [XCallEventType.CallMessageSent]: {
          eventType: XCallEventType.CallMessageSent,
          sn,
          xChainId: this.xChainId,
          rawEventData: callMessageSentLog,
        },
      };
    }
    return {};
  }

  async fetchDestinationEvents(transfer: BridgeTransfer) {
    //TODO: implement this
    console.log('fetchDestinationEvents executed');
    return {};
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
        txResult = await cx.crossTransfer(destination, `${currencyAmountToBridge.quotient}`, xCallFee.rollback);
      } else if (ASSET_MANAGER_TOKENS.includes(currencyAmountToBridge.currency.symbol || '')) {
        try {
          txResult = await bnJs
            .inject({ account })
            .AssetManager[isLiquidFinanceEnabled ? 'withdrawNativeTo' : 'withdrawTo'](
              `${currencyAmountToBridge.quotient}`,
              tokenAddress,
              destination,
              xCallFee.rollback,
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
          id: hash,
          bridgeInfo,
          transactions: [transaction],
          status: BridgeTransferStatus.AWAITING_CALL_MESSAGE_SENT,
          events: {},
          destinationChainInitialBlockHeight: -1,
        };
      }
    }
    return null;
  }
}
