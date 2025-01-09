import { Percent } from '@balancednetwork/sdk-core';
import bnJs from './bnJs';

import { XWalletClient } from '@/core/XWalletClient';
import { showMessageOnBeforeUnload, toDec } from '@/utils';
import { XTransactionInput, XTransactionType } from '../../xcall/types';
import { getRlpEncodedSwapData } from '../../xcall/utils';
import { isSpokeToken } from '../archway/utils';
import { IconXService } from './IconXService';

export class IconXWalletClient extends XWalletClient {
  getXService(): IconXService {
    return IconXService.getInstance();
  }

  getWalletClient() {
    return this.getXService().iconService;
  }

  async approve(amountToApprove, spender, owner) {
    return Promise.resolve(undefined);
  }

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

      const tokenAddress = inputAmount.wrapped.currency.address;
      const destination = `${direction.to}/${destinationAddress}`;

      let txResult;
      const _isSpokeToken = isSpokeToken(inputAmount.currency);

      if (_isSpokeToken) {
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

    let txResult;
    if (executionTrade.inputAmount.currency.symbol === 'ICX') {
      const rlpEncodedData = getRlpEncodedSwapData(executionTrade).toString('hex');

      txResult = await bnJs
        .inject({ account })
        .Router.swapICXV2(toDec(executionTrade.inputAmount), rlpEncodedData, toDec(minReceived), receiver);
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

  async _executeSwapOnIcon(xTransactionInput: XTransactionInput) {
    const { executionTrade, account, direction, recipient, slippageTolerance } = xTransactionInput;
    if (!executionTrade || !slippageTolerance) {
      return;
    }

    const minReceived = executionTrade.minimumAmountOut(new Percent(slippageTolerance, 10_000));

    let txResult;
    if (executionTrade.inputAmount.currency.symbol === 'ICX') {
      const rlpEncodedData = getRlpEncodedSwapData(executionTrade).toString('hex');

      txResult = await bnJs
        .inject({ account })
        .Router.swapICXV2(toDec(executionTrade.inputAmount), rlpEncodedData, toDec(minReceived), recipient);
    } else {
      const token = executionTrade.inputAmount.currency.wrapped;

      const rlpEncodedData = getRlpEncodedSwapData(executionTrade, '_swap', recipient, minReceived).toString('hex');

      txResult = await bnJs
        .inject({ account })
        .getContract(token.address)
        .swapUsingRouteV2(toDec(executionTrade.inputAmount), rlpEncodedData);
    }

    const { result: hash } = txResult || {};
    if (hash) {
      return hash;
    }
  }

  async executeSwapOrBridge(xTransactionInput: XTransactionInput) {
    const { type } = xTransactionInput;

    if (type === XTransactionType.SWAP_ON_ICON) {
      return this._executeSwapOnIcon(xTransactionInput);
    } else if (type === XTransactionType.SWAP) {
      return this._executeSwap(xTransactionInput);
    } else if (type === XTransactionType.BRIDGE) {
      return this._executeBridge(xTransactionInput);
    } else {
      throw new Error('Invalid XTransactionType');
    }
  }

  async executeDepositCollateral(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }

  async executeWithdrawCollateral(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }

  async executeBorrow(xTransactionInput: XTransactionInput) {
    const { inputAmount, account, xCallFee, usedCollateral, recipient } = xTransactionInput;

    if (!inputAmount || !usedCollateral) {
      return;
    }

    if (account && xCallFee) {
      window.addEventListener('beforeunload', showMessageOnBeforeUnload);

      const txResult = await bnJs
        .inject({ account: account })
        .Loans.borrow(inputAmount.quotient.toString(), usedCollateral, 'bnUSD', recipient);

      const { result: hash } = txResult || {};

      if (hash) {
        return hash;
      }
    }
    return undefined;
  }

  async executeRepay(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }

  async depositXToken(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }
  async withdrawXToken(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }
  async addLiquidity(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }
  async removeLiquidity(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }
  async stake(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }
  async unstake(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }
  async claimRewards(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }
}
