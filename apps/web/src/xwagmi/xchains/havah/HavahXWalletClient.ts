import { Percent } from '@balancednetwork/sdk-core';
import bnJs from '../icon/bnJs';

import { ICON_XCALL_NETWORK_ID } from '@/constants/config';
import { showMessageOnBeforeUnload } from '@/utils/messages';

import { NATIVE_ADDRESS } from '@/constants/index';
import { toDec } from '@/utils';
import { XWalletClient } from '@/xwagmi/core/XWalletClient';
import { toHex } from 'viem';
import { XTransactionInput, XTransactionType } from '../../xcall/types';
import { getRlpEncodedSwapData } from '../../xcall/utils';
import { HavahXService } from './HavahXService';
import { havahJs } from './havahJs';

export class HavahXWalletClient extends XWalletClient {
  getXService(): HavahXService {
    return HavahXService.getInstance();
  }

  async approve(token, owner, spender, currencyAmountToApprove) {}

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

      // data = toHex(
      //   JSON.stringify({
      //     method: '_swap',
      //     params: {
      //       path: executionTrade.route.pathForSwap,
      //       receiver: receiver,
      //       minimumReceive: minReceived.quotient.toString(),
      //     },
      //   }),
      // );

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

    const isNative = inputAmount.currency.wrapped.address === NATIVE_ADDRESS;
    const isBnUSD = inputAmount.currency.symbol === 'bnUSD';

    let txResult;
    if (isBnUSD) {
      console.log('isBnUSD');
      txResult = await havahJs.inject({ account }).bnUSD['crossTransferV2'](
        destination,
        // parseInt(inputAmount.quotient.toString()),
        toDec(inputAmount),
        data,
        xCallFee.rollback.toString(),
      );
    } else {
      if (!isNative) {
        throw new Error('Only native token and bnUSD are supported');
      } else {
        console.log('isNative');
        txResult = await havahJs
          .inject({ account })
          .AssetManager['deposit'](parseFloat(inputAmount.toExact()), destination, data, xCallFee.rollback.toString());
      }
    }
    const { txHash: hash } = txResult || {};

    if (hash) {
      return hash;
    }
  }
}
