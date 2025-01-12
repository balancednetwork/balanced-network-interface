import { archway } from '@/constants/xChains';
import { DepositParams, SendCallParams, XWalletClient } from '@/core/XWalletClient';
import { XToken } from '@/types';
import { XSigningArchwayClient } from '@/xchains/archway/XSigningArchwayClient';
import { getFeeParam, isDenomAsset } from '@/xchains/archway/utils';
import { CurrencyAmount, MaxUint256 } from '@balancednetwork/sdk-core';
import { XTransactionInput } from '../../xcall/types';
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
          data: Array.from(data),
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
          data: Array.from(data),
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
        data: Array.from(data),
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

  async executeDepositCollateral(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    throw new Error('Not supported.');
  }

  async executeWithdrawCollateral(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    throw new Error('Not supported.');
  }

  async executeBorrow(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    throw new Error('Not supported.');
  }
}
