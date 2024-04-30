import bnJs from 'bnJs';
import { showMessageOnBeforeUnload } from 'utils/messages';

import { BridgeTransferStatus, bridgeTransferActions } from '../_zustand/useBridgeTransferStore';
import { transactionActions } from '../_zustand/useTransactionStore';

import { ASSET_MANAGER_TOKENS, CROSS_TRANSFER_TOKENS } from 'app/_xcall/config';

import { iconService } from 'app/_xcall/_icon/utils';
import { XCallEventType, XChainId } from 'app/_xcall/types';
import { xChainMap } from 'app/_xcall/archway/config1';

import { fetchTxResult, getICONEventSignature, getXCallOriginEventDataFromICON } from 'app/_xcall/_icon/utils';

export class IconXCallService {
  chainId: any;
  iconService: any;
  changeShouldLedgerSign: any;

  constructor(chainId, iconService, changeShouldLedgerSign) {
    this.chainId = chainId;
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

  async fetchSourceEvents(transfer) {
    console.log('fetchSourceEvents executed');
    const transaction = transfer.transactions[0];
    const hash = transaction.hash;
    const txResult = await fetchTxResult(hash);

    if (txResult?.status === 1 && txResult.eventLogs.length) {
      return {
        [XCallEventType.CallMessageSent]: {
          hash,
          blockHeight: txResult.blockHeight,
          blockHash: txResult.blockHash,
          eventLogs: txResult.eventLogs,
        },
      };
    }

    return {};
  }

  async fetchDestinationEvents() {
    //TODO: implement this
    console.log('fetchDestinationEvents executed');
    return {};
  }

  async executeTransfer(transferData) {
    const { bridgeInfo } = transferData;
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

      const tokenAddress = currencyAmountToBridge.currency.address;
      const destination = `${bridgeDirection.to}/${destinationAddress}`;

      let txResult;
      if (CROSS_TRANSFER_TOKENS.includes(currencyAmountToBridge.currency.symbol)) {
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
