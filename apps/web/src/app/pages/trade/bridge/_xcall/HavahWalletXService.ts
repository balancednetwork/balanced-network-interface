import bnJs, { havahJs } from 'bnJs';
import IconService from 'icon-sdk-js';
import { Percent } from '@balancednetwork/sdk-core';

import { showMessageOnBeforeUnload } from 'utils/messages';
import { ICON_XCALL_NETWORK_ID } from 'constants/config';

import { XChainId } from 'app/pages/trade/bridge/types';
import { XTransactionInput } from '../_zustand/types';
import { IWalletXService } from './types';
import { HavahPublicXService } from './HavahPublicXService';
import { toHex } from 'viem';

export class HavahWalletXService extends HavahPublicXService implements IWalletXService {
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
    const { direction, inputAmount, recipient: destinationAddress, account, xCallFee } = xTransactionInput;

    if (account && xCallFee) {
      window.addEventListener('beforeunload', showMessageOnBeforeUnload);

      const tokenAddress = inputAmount.wrapped.currency.address;
      const destination = `${direction.to}/${destinationAddress}`;

      let txResult;
      const isBnUSD = inputAmount.currency.symbol === 'bnUSD';

      if (isBnUSD) {
        // TODO: bnUSD not supported yet
      } else {
        txResult = await havahJs
          .inject({ account })
          .AssetManager['deposit'](parseFloat(inputAmount.toExact()), destination, '', xCallFee.rollback.toString());

        console.log('txResult', txResult);
      }

      const { txHash: hash } = txResult || {};

      if (hash) {
        return hash;
      }
    }
  }

  async executeSwap(xTransactionInput: XTransactionInput) {
    const { executionTrade, account, direction, recipient, slippageTolerance, xCallFee } = xTransactionInput;

    if (!executionTrade || !slippageTolerance) {
      return;
    }

    const minReceived = executionTrade.minimumAmountOut(new Percent(slippageTolerance, 10_000));
    const receiver = `${direction.to}/${recipient}`;
    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Router.address}`;

    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    const data = toHex(
      JSON.stringify({
        method: '_swap',
        params: {
          path: executionTrade.route.pathForSwap,
          receiver: receiver,
          minimumReceive: minReceived.quotient.toString(),
        },
      }),
    );

    const isBnUSD = executionTrade.inputAmount.currency.symbol === 'bnUSD';

    let txResult;
    if (isBnUSD) {
      // TODO: bnUSD not supported yet
    } else {
      txResult = await havahJs
        .inject({ account })
        .AssetManager['deposit'](
          parseFloat(executionTrade.inputAmount.toExact()),
          destination,
          data,
          xCallFee.rollback.toString(),
        );
    }
    const { txHash: hash } = txResult || {};

    if (hash) {
      return hash;
    }
  }
}
