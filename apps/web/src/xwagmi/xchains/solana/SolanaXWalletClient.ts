import { Percent } from '@balancednetwork/sdk-core';
import bnJs from '../icon/bnJs';

import { ICON_XCALL_NETWORK_ID } from '@/xwagmi/constants';

import { XWalletClient } from '@/xwagmi/core/XWalletClient';
import { toBytes } from 'viem';
import { XTransactionInput, XTransactionType } from '../../xcall/types';
import { getRlpEncodedSwapData } from '../../xcall/utils';
import { SolanaXService } from './SolanaXService';

export class SolanaXWalletClient extends XWalletClient {
  getXService(): SolanaXService {
    return SolanaXService.getInstance();
  }

  async approve(token, owner, spender, currencyAmountToApprove) {}

  async executeTransaction(xTransactionInput: XTransactionInput, options) {
    const { signTransaction } = options;
    if (!signTransaction) {
      throw new Error('signTransaction is required');
    }

    const { type, executionTrade, account, direction, inputAmount, recipient, slippageTolerance, xCallFee } =
      xTransactionInput;

    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Router.address}`;
    const receiver = `${direction.to}/${recipient}`;

    let data;
    if (type === XTransactionType.SWAP) {
      if (!executionTrade || !slippageTolerance) {
        return;
      }

      const minReceived = executionTrade.minimumAmountOut(new Percent(slippageTolerance, 10_000));

      const rlpEncodedData = getRlpEncodedSwapData(executionTrade, '_swap', receiver, minReceived);
      data = rlpEncodedData;
    } else if (type === XTransactionType.BRIDGE) {
      data = toBytes(
        JSON.stringify({
          method: '_swap',
          params: {
            path: [],
            receiver: receiver,
          },
        }),
      );
    } else if (type === XTransactionType.DEPOSIT) {
      return await this.executeDepositCollateral(xTransactionInput, options);
    } else if (type === XTransactionType.WITHDRAW) {
      return await this.executeWithdrawCollateral(xTransactionInput, options);
    } else if (type === XTransactionType.BORROW) {
      return await this.executeBorrow(xTransactionInput, options);
    } else if (type === XTransactionType.REPAY) {
      return await this.executeRepay(xTransactionInput, options);
    } else {
      throw new Error('Invalid XTransactionType');
    }

    let txResult;
    const { digest: hash } = txResult || {};

    if (hash) {
      return hash;
    }
  }

  async executeDepositCollateral(xTransactionInput: XTransactionInput, options) {}

  async executeWithdrawCollateral(xTransactionInput: XTransactionInput, options) {}

  async executeBorrow(xTransactionInput: XTransactionInput, options) {}

  async executeRepay(xTransactionInput: XTransactionInput, options) {}
}
