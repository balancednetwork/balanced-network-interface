import bnJs from 'bnJs';
import IconService from 'icon-sdk-js';
import { Percent } from '@balancednetwork/sdk-core';

import { showMessageOnBeforeUnload } from 'utils/messages';
import { toDec } from 'utils';
import { NETWORK_ID } from 'constants/config';

import { CROSS_TRANSFER_TOKENS } from 'app/pages/trade/bridge/_config/xTokens';
import { XChainId } from 'app/pages/trade/bridge/types';
import { XTransactionInput } from '../_zustand/types';
import { IWalletXService } from './types';
import { IconPublicXService } from './IconPublicXService';

export class IconWalletXService extends IconPublicXService implements IWalletXService {
  walletClient: IconService; // reserved for future use
  changeShouldLedgerSign: any;

  constructor(xChainId: XChainId, publicClient: IconService, walletClient: IconService, options?: any) {
    super(xChainId, publicClient);
    this.walletClient = walletClient;

    const { changeShouldLedgerSign } = options || {};
    this.changeShouldLedgerSign = changeShouldLedgerSign;
  }

  async approve(token, owner, spender, currencyAmountToApprove) {}

  async executeTransfer(xTransactionInput: XTransactionInput) {
    const {
      direction,
      inputAmount,
      recipient: destinationAddress,
      account,
      xCallFee,
      isLiquidFinanceEnabled,
    } = xTransactionInput;

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

  async executeSwap(xTransactionInput: XTransactionInput) {
    const { executionTrade, account, direction, recipient, slippageTolerance } = xTransactionInput;

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
