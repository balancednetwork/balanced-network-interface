import { Percent } from '@balancednetwork/sdk-core';
import bnJs from '../icon/bnJs';

import { ICON_XCALL_NETWORK_ID } from '@/xwagmi/constants';
import { archway } from '@/xwagmi/constants/xChains';
import { XWalletClient } from '@/xwagmi/core/XWalletClient';
import { XToken } from '@/xwagmi/types';
import { XSigningArchwayClient } from '@/xwagmi/xchains/archway/XSigningArchwayClient';
import { getFeeParam, isDenomAsset } from '@/xwagmi/xchains/archway/utils';
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

  async approve(token: XToken, owner: string, spender: string, currencyAmountToApprove: CurrencyAmount<XToken>) {
    const msg = {
      increase_allowance: {
        spender: spender,
        amount: currencyAmountToApprove?.quotient
          ? currencyAmountToApprove?.quotient.toString()
          : MaxUint256.toString(),
      },
    };

    const hash = await this.getWalletClient().executeSync(owner, token.address, msg, getFeeParam(400000));

    if (hash) {
      return hash;
    }
  }

  async executeTransaction(xTransactionInput: XTransactionInput) {
    const { type, direction, inputAmount, executionTrade, account, recipient, xCallFee, slippageTolerance } =
      xTransactionInput;

    const token = inputAmount.currency.wrapped;
    const receiver = `${direction.to}/${recipient}`;

    let data;
    if (type === XTransactionType.SWAP) {
      if (!executionTrade || !slippageTolerance) {
        return;
      }

      const minReceived = executionTrade.minimumAmountOut(new Percent(slippageTolerance, 10_000));
      const rlpEncodedData = getRlpEncodedSwapData(executionTrade, '_swap', receiver, minReceived);
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
          getFeeParam(1200000),
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
}
