import bnJs from '@/bnJs';
import { Percent } from '@balancednetwork/sdk-core';

import { getBytesFromString, getRlpEncodedSwapData } from '@/app/pages/trade/bridge/utils';
import { injective } from '@/app/pages/trade/bridge/_config/xChains';
import { getFeeParam, isDenomAsset } from '@/packages/archway/utils';
import { XChainId, XToken } from '@/app/pages/trade/bridge/types';
import { IWalletXService } from './types';
import { XTransactionInput, XTransactionType } from '../_zustand/types';
import { CurrencyAmount, MaxUint256 } from '@balancednetwork/sdk-core';
import { ICON_XCALL_NETWORK_ID } from '@/constants/config';
import { InjectivePublicXService } from './InjectivePublicXService';

import { MsgExecuteContractCompat } from '@injectivelabs/sdk-ts';
import { Network, getNetworkEndpoints } from '@injectivelabs/networks';

export const NETWORK = Network.Mainnet;
export const ENDPOINTS = getNetworkEndpoints(NETWORK);
import { MsgBroadcaster } from '@injectivelabs/wallet-ts';
import { walletStrategy } from '@/packages/injective';

const msgBroadcastClient = new MsgBroadcaster({
  walletStrategy,
  network: NETWORK,
  endpoints: ENDPOINTS,
});

export class InjectiveWalletXService extends InjectivePublicXService implements IWalletXService {
  walletClient: any;

  constructor(xChainId: XChainId, publicClient: any, walletClient: any, options?: any) {
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

  async executeTransaction(xTransactionInput: XTransactionInput) {
    const { type, direction, inputAmount, executionTrade, account, recipient, xCallFee, slippageTolerance } =
      xTransactionInput;

    // if (!this.walletClient) {
    //   throw new Error('Wallet client not found');
    // }

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
      const msg = MsgExecuteContractCompat.fromJSON({
        contractAddress: injective.contracts.bnUSD!,
        sender: account,
        msg: {
          cross_transfer: {
            amount: inputAmount.quotient.toString(),
            to: `${ICON_XCALL_NETWORK_ID}/${bnJs.Router.address}`,
            data,
          },
        },
        funds: [
          {
            denom: 'inj',
            amount: xCallFee.rollback.toString(),
          },
        ],
      });

      const txResult = await msgBroadcastClient.broadcastWithFeeDelegation({
        msgs: msg,
        injectiveAddress: account,
      });

      return txResult.txHash;
    } else {
      // assume it's an only native asset - INJ
      const msg = MsgExecuteContractCompat.fromJSON({
        contractAddress: injective.contracts.assetManager,
        sender: account,
        msg: {
          deposit_denom: {
            denom: 'inj',
            to: `${ICON_XCALL_NETWORK_ID}/${bnJs.Router.address}`,
            data,
          },
        },
        funds: [
          {
            denom: 'inj',
            amount: BigInt(inputAmount.quotient + xCallFee.rollback).toString(),
          },
        ],
      });

      const txResult = await msgBroadcastClient.broadcastWithFeeDelegation({
        msgs: msg,
        injectiveAddress: account,
      });

      return txResult.txHash;
    }
  }
}
