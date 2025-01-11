import { Percent } from '@balancednetwork/sdk-core';
import bnJs from '../icon/bnJs';

import { ICON_XCALL_NETWORK_ID } from '@/constants';
import { DepositParams, SendCallParams, XWalletClient } from '@/core/XWalletClient';
import { showMessageOnBeforeUnload, toDec } from '@/utils';
import { toHex } from 'viem';
import { XTransactionInput, XTransactionType } from '../../xcall/types';
import { getRlpEncodedSwapData } from '../../xcall/utils';
import { isSpokeToken } from '../archway';
import { HavahXService } from './HavahXService';

export class HavahXWalletClient extends XWalletClient {
  getXService(): HavahXService {
    return HavahXService.getInstance();
  }

  async approve(amountToApprove, spender, owner) {
    return Promise.resolve(undefined);
  }

  async _deposit({ account, inputAmount, destination, data, fee }: DepositParams) {
    const isNative = inputAmount.currency.isNativeToken;
    if (!isNative) {
      throw new Error('Only native token and bnUSD are supported');
    }
    const txResult = await this.getXService()
      .walletClient.inject({ account })
      .AssetManager['deposit'](parseFloat(inputAmount.toExact()), destination, data, fee.toString());
    const { txHash: hash } = txResult || {};
    return hash;
  }

  async _crossTransfer({ account, inputAmount, destination, data, fee }: DepositParams) {
    const txResult = await this.getXService()
      .walletClient.inject({ account })
      .bnUSD['crossTransferV2'](destination, toDec(inputAmount), data, fee);
    const { txHash: hash } = txResult || {};
    return hash;
  }

  async _sendCall({ account, sourceChainId, destination, data, fee }: SendCallParams): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }

  async executeSwapOrBridge(xTransactionInput: XTransactionInput) {
    const { type, executionTrade, account, direction, inputAmount, recipient, slippageTolerance, xCallFee } =
      xTransactionInput;

    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Router.address}`;
    const receiver = `${direction.to}/${recipient}`;

    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    let data;
    if (type === XTransactionType.SWAP) {
      if (!executionTrade || !slippageTolerance) {
        return;
      }

      const minReceived = executionTrade.minimumAmountOut(new Percent(slippageTolerance, 10_000));
      const rlpEncodedData = getRlpEncodedSwapData(executionTrade, '_swap', receiver, minReceived).toString('hex');
      data = `0x${rlpEncodedData}`;
    } else if (type === XTransactionType.BRIDGE) {
      data = toHex(
        JSON.stringify({
          method: '_swap',
          params: {
            path: [],
            receiver: receiver,
          },
        }),
      );
    } else {
      throw new Error('Invalid XTransactionType');
    }

    if (isSpokeToken(inputAmount.currency)) {
      return await this._crossTransfer({ account, inputAmount, destination, data, fee: xCallFee.rollback });
    } else {
      return await this._deposit({ account, inputAmount, destination, data, fee: xCallFee.rollback });
    }
  }

  async executeDepositCollateral(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }

  async executeWithdrawCollateral(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }

  async executeBorrow(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }

  async executeRepay(xTransactionInput: XTransactionInput) {
    const { account, inputAmount, recipient, xCallFee, usedCollateral } = xTransactionInput;

    if (!inputAmount || !usedCollateral) {
      return;
    }

    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`;
    const data = toHex(
      JSON.stringify(recipient ? { _collateral: usedCollateral, _to: recipient } : { _collateral: usedCollateral }),
    );

    return await this._crossTransfer({
      account,
      inputAmount: inputAmount.multiply(-1),
      destination,
      data,
      fee: xCallFee.rollback,
    });
  }
}
