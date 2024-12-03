import { Percent } from '@balancednetwork/sdk-core';
import bnJs from '../icon/bnJs';

import { ICON_XCALL_NETWORK_ID } from '@/constants';
import { XWalletClient } from '@/core/XWalletClient';
import { showMessageOnBeforeUnload, toDec } from '@/utils';
import { toHex } from 'viem';
import { XTransactionInput, XTransactionType } from '../../xcall/types';
import { getRlpEncodedSwapData } from '../../xcall/utils';
import { HavahXService } from './HavahXService';

export class HavahXWalletClient extends XWalletClient {
  getXService(): HavahXService {
    return HavahXService.getInstance();
  }

  async approve(amountToApprove, spender, owner) {
    return Promise.resolve(undefined);
  }

  async executeTransaction(xTransactionInput: XTransactionInput) {
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
    } else if (type === XTransactionType.REPAY) {
      return await this._executeRepay(xTransactionInput);
    } else {
      throw new Error('Invalid XTransactionType');
    }

    const isNative = inputAmount.currency.isNativeToken;
    const isBnUSD = inputAmount.currency.symbol === 'bnUSD';

    let txResult;
    if (isBnUSD) {
      txResult = await this.getXService()
        .walletClient.inject({ account })
        .bnUSD['crossTransferV2'](destination, toDec(inputAmount), data, xCallFee.rollback.toString());
    } else {
      if (!isNative) {
        throw new Error('Only native token and bnUSD are supported');
      } else {
        console.log('isNative');
        txResult = await this.getXService()
          .walletClient.inject({ account })
          .AssetManager['deposit'](parseFloat(inputAmount.toExact()), destination, data, xCallFee.rollback.toString());
      }
    }
    const { txHash: hash } = txResult || {};

    if (hash) {
      return hash;
    }
  }

  async _executeRepay(xTransactionInput: XTransactionInput) {
    const { account, inputAmount, recipient, xCallFee, usedCollateral } = xTransactionInput;

    if (!inputAmount || !usedCollateral) {
      return;
    }

    const amount = toDec(inputAmount.multiply(-1));
    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`;
    const data = toHex(
      JSON.stringify(recipient ? { _collateral: usedCollateral, _to: recipient } : { _collateral: usedCollateral }),
    );

    const txResult = await this.getXService()
      .walletClient.inject({ account })
      .bnUSD['crossTransferV2'](destination, amount, data, xCallFee.rollback.toString());

    // @ts-ignore
    const { txHash: hash } = txResult || {};

    if (hash) {
      return hash;
    }
  }
}
