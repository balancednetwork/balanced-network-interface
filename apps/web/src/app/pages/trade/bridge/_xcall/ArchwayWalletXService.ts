import { ArchwayClient, StdFee } from '@archwayhq/arch3.js';
import bnJs from 'bnJs';
import { Percent } from '@balancednetwork/sdk-core';

import { XSigningArchwayClient } from 'lib/archway/XSigningArchwayClient';
import { getBytesFromString } from 'app/pages/trade/bridge/utils';

import { archway } from 'app/pages/trade/bridge/_config/xChains';
import { getFeeParam, isDenomAsset } from 'app/_xcall/archway/utils';
import { ARCHWAY_FEE_TOKEN_SYMBOL } from 'app/_xcall/_icon/config';

import { XChainId, XToken } from 'app/pages/trade/bridge/types';
import { IWalletXService } from './types';
import { XTransactionInput } from '../_zustand/types';
import { CurrencyAmount, MaxUint256 } from '@balancednetwork/sdk-core';
import { ICON_XCALL_NETWORK_ID } from 'constants/config';
import { ArchwayPublicXService } from './ArchwayPublicXService';

export class ArchwayWalletXService extends ArchwayPublicXService implements IWalletXService {
  walletClient: XSigningArchwayClient;

  constructor(xChainId: XChainId, publicClient: ArchwayClient, walletClient: XSigningArchwayClient, options?: any) {
    super(xChainId, publicClient);
    this.walletClient = walletClient;
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

    const hash = await this.walletClient.executeSync(owner, token.address, msg, getFeeParam(400000));

    if (hash) {
      return hash;
    }
  }

  async executeTransfer(xTransactionInput: XTransactionInput) {
    const { direction, inputAmount, recipient: destinationAddress, account, xCallFee } = xTransactionInput;
    const isDenom = inputAmount && inputAmount.currency instanceof XToken ? isDenomAsset(inputAmount.currency) : false;

    if (this.walletClient) {
      const tokenAddress = inputAmount.wrapped.currency.address;
      const destination = `${direction.to}/${destinationAddress}`;

      const executeTransaction = async (msg: any, contract: string, fee: StdFee | 'auto', assetToBridge?: any) => {
        try {
          const hash = await this.walletClient.executeSync(
            account,
            contract,
            msg,
            fee,
            undefined,
            xCallFee.rollback !== 0n
              ? [
                  { amount: xCallFee.rollback.toString(), denom: ARCHWAY_FEE_TOKEN_SYMBOL },
                  ...(assetToBridge ? [assetToBridge] : []),
                ]
              : assetToBridge
                ? [assetToBridge]
                : undefined,
          );

          return hash;
        } catch (e) {
          console.error(e);
        }
      };

      let transaction: any;
      if (isDenom) {
        const msg = { deposit_denom: { denom: tokenAddress, to: destination, data: [] } };
        const assetToBridge = {
          denom: tokenAddress,
          amount: `${inputAmount.quotient}`,
        };

        transaction = await executeTransaction(
          msg,
          archway.contracts.assetManager,
          getFeeParam(1200000),
          assetToBridge,
        );
      } else {
        const isBnUSD = inputAmount.currency.symbol === 'bnUSD';

        if (isBnUSD) {
          const msg = {
            cross_transfer: {
              amount: `${inputAmount.quotient}`,
              to: destination,
              data: [],
            },
          };

          transaction = await executeTransaction(msg, tokenAddress, 'auto');
        } else {
          const msg = {
            deposit: {
              token_address: tokenAddress,
              amount: `${inputAmount.quotient}`,
              to: destination,
              data: [],
            },
          };

          transaction = await executeTransaction(msg, archway.contracts.assetManager, getFeeParam(1200000));
        }
      }
      return transaction;
    }
  }
  async executeSwap(xTransactionInput: XTransactionInput) {
    const { direction, inputAmount, executionTrade, account, recipient, xCallFee, slippageTolerance } =
      xTransactionInput;

    if (!executionTrade || !slippageTolerance) {
      return;
    }

    const minReceived = executionTrade.minimumAmountOut(new Percent(slippageTolerance, 10_000));

    const receiver = `${direction.to}/${recipient}`;
    const token = inputAmount.currency.wrapped;

    const swapParams = {
      path: executionTrade.route.pathForSwap,
      receiver: receiver,
    };

    const data = getBytesFromString(
      JSON.stringify({
        method: '_swap',
        params: swapParams,
        minimumReceive: minReceived.quotient.toString(),
      }),
    );

    if (['bnUSD'].includes(token.symbol)) {
      //handle icon native tokens vs spoke assets
      const msg = {
        cross_transfer: {
          amount: inputAmount.quotient.toString(),
          to: `${ICON_XCALL_NETWORK_ID}/${bnJs.Router.address}`,
          data,
        },
      };

      try {
        const hash = await this.walletClient.executeSync(
          account, //
          archway.contracts.bnUSD!,
          msg,
          'auto',
          undefined,
          [{ amount: xCallFee?.rollback.toString(), denom: ARCHWAY_FEE_TOKEN_SYMBOL }],
        );
        return hash;
      } catch (e) {
        console.error(e);
      }
    } else {
      const msg = {
        deposit: {
          token_address: token.address,
          amount: inputAmount.quotient.toString(),
          to: `${ICON_XCALL_NETWORK_ID}/${bnJs.Router.address}`,
          data,
        },
      };

      try {
        const hash = await this.walletClient.executeSync(
          account,
          archway.contracts.assetManager,
          msg,
          'auto',
          undefined,
          [{ amount: xCallFee.rollback.toString(), denom: ARCHWAY_FEE_TOKEN_SYMBOL }],
        );
        return hash;
      } catch (e) {
        console.error(e);
      }
    }
  }

  async executeDepositCollateral(xTransactionInput: XTransactionInput) {
    //todo: executeDepositCollateral cosmos
    console.error('executeDepositCollateral cosmos not implemented');
    return Promise.resolve('todo');
  }

  async executeWithdrawCollateral(xTransactionInput: XTransactionInput) {
    //todo: executeWithdraw cosmos
    console.error('executeWithdrawCollateral cosmos not implemented');
    return Promise.resolve('todo');
  }

  async executeBorrow(xTransactionInput: XTransactionInput) {
    //todo: executeBorrow cosmos
    console.error('executeBorrow cosmos not implemented');
    return Promise.resolve('todo');
  }

  async executeRepay(xTransactionInput: XTransactionInput) {
    //todo: executeRepay cosmos
    console.error('executeRepay cosmos not implemented');
    return Promise.resolve('todo');
  }
}
