import bnJs from './bnJs';

import { DepositParams, SendCallParams, XWalletClient } from '@/core/XWalletClient';
import { isSpokeToken } from '@/utils';
import { showMessageOnBeforeUnload, toDec } from '@/utils';
import { XTransactionInput, XTransactionType } from '../../xcall/types';
import { getRlpEncodedSwapData } from '../../xcall/utils';
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

  async _deposit({ account, inputAmount, destination, data, fee }: DepositParams): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }
  async _crossTransfer({ account, inputAmount, destination, data, fee }: DepositParams): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }
  async _sendCall({ account, sourceChainId, destination, data, fee }: SendCallParams): Promise<string | undefined> {
    throw new Error('Method not implemented.');
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
    const { account, direction, recipient, inputAmount, minReceived, path } = xTransactionInput;

    if (!minReceived || !path) {
      return;
    }

    const receiver = `${direction.to}/${recipient}`;

    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    let txResult;
    if (inputAmount.currency.symbol === 'ICX') {
      const rlpEncodedData = getRlpEncodedSwapData(path).toString('hex');

      txResult = await bnJs
        .inject({ account })
        .Router.swapICXV2(toDec(inputAmount), rlpEncodedData, toDec(minReceived), receiver);
    } else {
      const inputToken = inputAmount.currency.wrapped;

      const cx = inputToken.symbol === 'wICX' ? bnJs.wICX : bnJs.getContract(inputToken.address);

      const rlpEncodedData = getRlpEncodedSwapData(path, '_swap', receiver, minReceived).toString('hex');

      txResult = await cx.inject({ account }).swapUsingRouteV2(toDec(inputAmount), rlpEncodedData);
    }

    const { result: hash } = txResult || {};
    if (hash) {
      return hash;
    }
  }

  async _executeSwapOnIcon(xTransactionInput: XTransactionInput) {
    const { account, recipient, minReceived, path, inputAmount } = xTransactionInput;
    if (!minReceived || !path) {
      return;
    }

    let txResult;
    if (inputAmount.currency.symbol === 'ICX') {
      const rlpEncodedData = getRlpEncodedSwapData(path).toString('hex');

      txResult = await bnJs
        .inject({ account })
        .Router.swapICXV2(toDec(inputAmount), rlpEncodedData, toDec(minReceived), recipient);
    } else {
      const token = inputAmount.currency.wrapped;

      const rlpEncodedData = getRlpEncodedSwapData(path, '_swap', recipient, minReceived).toString('hex');

      txResult = await bnJs
        .inject({ account })
        .getContract(token.address)
        .swapUsingRouteV2(toDec(inputAmount), rlpEncodedData);
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
    const { account, inputAmount } = xTransactionInput;

    const res: any = await bnJs
      .inject({ account })
      .getContract(inputAmount.currency.address)
      .deposit(toDec(inputAmount));

    return res.result;
  }
  async withdrawXToken(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    const { account, inputAmount } = xTransactionInput;

    const res: any = await bnJs.inject({ account }).Dex.withdraw(inputAmount.currency.address, toDec(inputAmount));

    return res.result;
  }
  async addLiquidity(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    const DEFAULT_SLIPPAGE_LP = 200;
    const { account, inputAmount, outputAmount } = xTransactionInput;

    if (!outputAmount) {
      throw new Error('outputAmount is required');
    }

    const baseToken = inputAmount.currency;
    const quoteToken = outputAmount?.currency;
    const res: any = await bnJs
      .inject({ account })
      .Dex.add(baseToken.address, quoteToken.address, toDec(inputAmount), toDec(outputAmount), DEFAULT_SLIPPAGE_LP);

    return res.result;
  }

  async removeLiquidity(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    const { account, inputAmount, poolId } = xTransactionInput;

    if (!poolId) {
      throw new Error('poolId is required');
    }

    const res: any = await bnJs.inject({ account }).Dex.remove(poolId, toDec(inputAmount));

    return res.result;
  }

  async stake(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    const { account, inputAmount, poolId } = xTransactionInput;

    if (!poolId) {
      throw new Error('poolId is required');
    }

    const res: any = await bnJs.inject({ account: account }).Dex.stake(poolId, toDec(inputAmount));
    return res.result;
  }
  async unstake(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    const { account, inputAmount, poolId } = xTransactionInput;

    if (!poolId) {
      throw new Error('poolId is required');
    }

    const res: any = await bnJs.inject({ account: account }).StakedLP.unstake(poolId, toDec(inputAmount));
    return res.result;
  }

  async claimRewards(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    // TODO: implement
    throw new Error('Method not implemented.');
  }
}
