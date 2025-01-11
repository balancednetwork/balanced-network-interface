import { Percent } from '@balancednetwork/sdk-core';
import bnJs from '../icon/bnJs';

import { ICON_XCALL_NETWORK_ID } from '@/constants';
import { archway } from '@/constants/xChains';
import { DepositParams, SendCallParams, XWalletClient } from '@/core/XWalletClient';
import { XToken } from '@/types';
import { XSigningArchwayClient } from '@/xchains/archway/XSigningArchwayClient';
import { getFeeParam, isDenomAsset, isSpokeToken } from '@/xchains/archway/utils';
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

    const hash = await this.getWalletClient().executeSync(owner, xToken.address, msg, getFeeParam(400000));

    if (hash) {
      return hash;
    }
  }

  async _deposit({ account, inputAmount, destination, data, fee }: DepositParams) {
    const isDenom = inputAmount && inputAmount.currency instanceof XToken ? isDenomAsset(inputAmount.currency) : false;

    if (isDenom) {
      const msg = {
        deposit_denom: {
          denom: inputAmount.currency.address,
          to: destination,
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
          { amount: fee.toString(), denom: ARCHWAY_FEE_TOKEN_SYMBOL },
          { amount: `${inputAmount.quotient}`, denom: inputAmount.currency.address },
        ],
      );
      return hash;
    } else {
      const msg = {
        deposit: {
          token_address: inputAmount.currency.address,
          amount: inputAmount.quotient.toString(),
          to: destination,
          data,
        },
      };

      const hash = await this.getWalletClient().executeSync(
        account,
        archway.contracts.assetManager,
        msg,
        'auto',
        undefined,
        [{ amount: fee.toString(), denom: ARCHWAY_FEE_TOKEN_SYMBOL }],
      );
      return hash;
    }
  }

  async _crossTransfer({ account, inputAmount, destination, data, fee }: DepositParams) {
    const msg = {
      cross_transfer: {
        amount: inputAmount.quotient.toString(),
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
      [{ amount: fee.toString(), denom: ARCHWAY_FEE_TOKEN_SYMBOL }],
    );
    return hash;
  }

  async _sendCall({ account, sourceChainId, destination, data, fee }: SendCallParams): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }

  async executeSwapOrBridge(xTransactionInput: XTransactionInput) {
    const { type, direction, inputAmount, executionTrade, account, recipient, xCallFee, slippageTolerance } =
      xTransactionInput;

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

    if (isSpokeToken(inputAmount.currency)) {
      return await this._crossTransfer({
        account,
        inputAmount,
        destination: `${ICON_XCALL_NETWORK_ID}/${bnJs.Router.address}`,
        data,
        fee: xCallFee.rollback,
      });
    } else {
      return await this._deposit({
        account,
        inputAmount,
        destination: `${ICON_XCALL_NETWORK_ID}/${bnJs.Router.address}`,
        data,
        fee: xCallFee.rollback,
      });
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
    const data = getBytesFromString(
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
