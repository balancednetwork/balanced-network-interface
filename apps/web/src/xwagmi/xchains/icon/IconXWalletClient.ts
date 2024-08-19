import bnJs from '@/bnJs';
import { Percent } from '@balancednetwork/sdk-core';

import { NETWORK_ID } from '@/constants/config';
import { toDec } from '@/utils';
import { showMessageOnBeforeUnload } from '@/utils/messages';
import { XWalletClient } from '@/xwagmi/core/XWalletClient';
import { XTransactionInput, XTransactionType } from '../../../lib/xcall/_zustand/types';
import { getRlpEncodedSwapData } from '../../../lib/xcall/utils';
import { IconXService } from './IconXService';

export class IconXWalletClient extends XWalletClient {
  changeShouldLedgerSign: any; // TODO: remove

  getXService(): IconXService {
    return IconXService.getInstance();
  }

  getWalletClient() {
    return this.getXService().iconService;
  }

  async approve(token, owner, spender, currencyAmountToApprove) {}

  async _executeBridge(xTransactionInput: XTransactionInput) {
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
      const isBnUSD = inputAmount.currency.symbol === 'bnUSD';

      if (isBnUSD) {
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

  async _executeSwap(xTransactionInput: XTransactionInput) {
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
      const rlpEncodedData = getRlpEncodedSwapData(executionTrade).toString('hex');

      txResult = await bnJs
        .inject({ account })
        .Router.swapICXV2(
          toDec(executionTrade.inputAmount),
          rlpEncodedData,
          NETWORK_ID === 1 ? toDec(minReceived) : '0x0',
          receiver,
        );
    } else {
      const inputToken = executionTrade.inputAmount.currency.wrapped;
      const outputToken = executionTrade.outputAmount.currency.wrapped;

      const cx = bnJs.inject({ account }).getContract(inputToken.address);

      const rlpEncodedData = getRlpEncodedSwapData(executionTrade, '_swap', receiver, minReceived).toString('hex');

      txResult = await cx.swapUsingRouteV2(toDec(executionTrade.inputAmount), rlpEncodedData);
    }

    const { result: hash } = txResult || {};
    if (hash) {
      return hash;
    }
  }

  async _executeBorrow(xTransactionInput: XTransactionInput) {
    const { inputAmount, account, xCallFee, usedCollateral, recipient } = xTransactionInput;

    if (!inputAmount || !usedCollateral) {
      return;
    }

    if (account && xCallFee) {
      window.addEventListener('beforeunload', showMessageOnBeforeUnload);

      if (bnJs.contractSettings.ledgerSettings.actived && this.changeShouldLedgerSign) {
        this.changeShouldLedgerSign(true);
      }

      const txResult = await bnJs
        .inject({ account: account })
        .Loans.borrow(inputAmount.quotient.toString(), usedCollateral, 'bnUSD', recipient);

      const { result: hash } = txResult || {};

      if (hash) {
        return hash;
      }
    }
  }

  async executeTransaction(xTransactionInput: XTransactionInput) {
    const { type } = xTransactionInput;

    if (type === XTransactionType.SWAP) {
      return this._executeSwap(xTransactionInput);
    } else if (type === XTransactionType.BRIDGE) {
      return this._executeBridge(xTransactionInput);
    } else if (type === XTransactionType.BORROW) {
      return this._executeBorrow(xTransactionInput);
    } else {
      throw new Error('Invalid XTransactionType');
    }
  }
}
