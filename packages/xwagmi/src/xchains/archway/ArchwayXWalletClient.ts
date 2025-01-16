import bnJs from '../icon/bnJs';

import { ICON_XCALL_NETWORK_ID } from '@/constants';
import { archway } from '@/constants/xChains';
import { XWalletClient } from '@/core/XWalletClient';
import { XToken } from '@/types';
import { XSigningArchwayClient } from '@/xchains/archway/XSigningArchwayClient';
import { isDenomAsset } from '@/xchains/archway/utils';
import { CurrencyAmount, MaxUint256 } from '@balancednetwork/sdk-core';
import { XTransactionInput, XTransactionType } from '../../xcall/types';
import { getBytesFromString, getRlpEncodedSwapData } from '../../xcall/utils';
import { ArchwayXService } from './ArchwayXService';
import { ARCHWAY_FEE_TOKEN_SYMBOL } from './constants';

export class ArchwayXWalletClient extends XWalletClient {
  getXService(): ArchwayXService {
    return ArchwayXService.getInstance();
  }

  getWalletClient(): XSigningArchwayClient {
    const walletClient = this.getXService().walletClient;
    if (!walletClient) {
      throw new Error('ArchwayXWalletClient: walletClient is not initialized yet');
    }
    return walletClient;
  }

  async approve(amountToApprove: CurrencyAmount<XToken>, spender: string, owner: string) {
    const xToken = amountToApprove.currency;

    const msg = {
      increase_allowance: {
        spender: spender,
        amount: amountToApprove?.quotient ? amountToApprove?.quotient.toString() : MaxUint256.toString(),
      },
    };

    const hash = await this.getWalletClient().executeSync(owner, xToken.address, msg, 'auto');

    if (hash) {
      return hash;
    }
  }

  async executeTransaction(xTransactionInput: XTransactionInput) {
    const { type, direction, inputAmount, account, recipient, xCallFee, minReceived, path } = xTransactionInput;

    const token = inputAmount.currency.wrapped;
    const receiver = `${direction.to}/${recipient}`;

    let data;
    if (type === XTransactionType.SWAP) {
      if (!path || !minReceived) {
        return;
      }

      const rlpEncodedData = getRlpEncodedSwapData(path, '_swap', receiver, minReceived);
      data = Array.from(rlpEncodedData);
    } else if (type === XTransactionType.BRIDGE) {
      data = getBytesFromString(
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

    const isDenom = inputAmount && inputAmount.currency instanceof XToken ? isDenomAsset(inputAmount.currency) : false;
    const isBnUSD = inputAmount.currency?.symbol === 'bnUSD';

    if (isBnUSD) {
      //handle icon native tokens vs spoke assets
      const msg = {
        cross_transfer: {
          amount: inputAmount.quotient.toString(),
          to: `${ICON_XCALL_NETWORK_ID}/${bnJs.Router.address}`,
          data,
        },
      };

      const hash = await this.getWalletClient().executeSync(
        account, //
        archway.contracts.bnUSD!,
        msg,
        'auto',
        undefined,
        [{ amount: xCallFee?.rollback.toString(), denom: ARCHWAY_FEE_TOKEN_SYMBOL }],
      );
      return hash;
    } else {
      if (isDenom) {
        const msg = {
          deposit_denom: {
            denom: token.address,
            to: `${ICON_XCALL_NETWORK_ID}/${bnJs.Router.address}`,
            data,
          },
        };

        const hash = await this.getWalletClient().executeSync(
          account,
          archway.contracts.assetManager,
          msg,
          'auto',
          undefined,
          [
            { amount: xCallFee.rollback.toString(), denom: ARCHWAY_FEE_TOKEN_SYMBOL },
            { amount: `${inputAmount.quotient}`, denom: token.address },
          ],
        );
        return hash;
      } else {
        const msg = {
          deposit: {
            token_address: token.address,
            amount: inputAmount.quotient.toString(),
            to: `${ICON_XCALL_NETWORK_ID}/${bnJs.Router.address}`,
            data,
          },
        };

        const hash = await this.getWalletClient().executeSync(
          account,
          archway.contracts.assetManager,
          msg,
          'auto',
          undefined,
          [{ amount: xCallFee.rollback.toString(), denom: ARCHWAY_FEE_TOKEN_SYMBOL }],
        );
        return hash;
      }
    }
  }

  async _executeRepay(xTransactionInput: XTransactionInput) {
    const { account, inputAmount, recipient, xCallFee, usedCollateral } = xTransactionInput;

    if (!inputAmount || !usedCollateral) {
      return;
    }

    const amount = inputAmount.multiply(-1).quotient.toString();
    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`;
    const data = getBytesFromString(
      JSON.stringify(recipient ? { _collateral: usedCollateral, _to: recipient } : { _collateral: usedCollateral }),
    );

    const msg = {
      cross_transfer: {
        amount,
        to: destination,
        data,
      },
    };

    const hash = await this.getWalletClient().executeSync(
      account, //
      archway.contracts.bnUSD!,
      msg,
      'auto',
      undefined,
      [{ amount: xCallFee?.rollback.toString(), denom: ARCHWAY_FEE_TOKEN_SYMBOL }],
    );
    return hash;
  }
}
