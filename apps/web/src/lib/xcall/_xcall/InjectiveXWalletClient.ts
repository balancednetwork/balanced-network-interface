import bnJs from '@/bnJs';
import { Percent } from '@balancednetwork/sdk-core';

import { ICON_XCALL_NETWORK_ID } from '@/constants/config';
import { getBytesFromString, getRlpEncodedSwapData, toICONDecimals } from '@/lib/xcall/utils';
import { getFeeParam, isDenomAsset } from '@/packages/archway/utils';
import { CurrencyAmount, MaxUint256 } from '@balancednetwork/sdk-core';
import { XTransactionInput, XTransactionType } from '../_zustand/types';
import { InjectiveXPublicClient } from './InjectiveXPublicClient';
import { XWalletClient } from './types';

import { NATIVE_ADDRESS } from '@/constants';
import { FROM_SOURCES, TO_SOURCES, injective } from '@/constants/xChains';
import { walletStrategy } from '@/packages/injective';
import { XChainId, XToken } from '@/types';
import { uintToBytes } from '@/utils';
import { RLP } from '@ethereumjs/rlp';
import { Network, getNetworkEndpoints } from '@injectivelabs/networks';
import { MsgExecuteContractCompat } from '@injectivelabs/sdk-ts';
import { MsgBroadcaster } from '@injectivelabs/wallet-ts';

export const NETWORK = Network.Mainnet;
export const ENDPOINTS = getNetworkEndpoints(NETWORK);

const msgBroadcastClient = new MsgBroadcaster({
  walletStrategy,
  network: NETWORK,
  endpoints: ENDPOINTS,
});

export class InjectiveXWalletClient extends InjectiveXPublicClient implements XWalletClient {
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
    } else if (type === XTransactionType.DEPOSIT) {
      return await this.executeDepositCollateral(xTransactionInput);
    } else if (type === XTransactionType.WITHDRAW) {
      return await this.executeWithdrawCollateral(xTransactionInput);
    } else if (type === XTransactionType.BORROW) {
      return await this.executeBorrow(xTransactionInput);
    } else if (type === XTransactionType.REPAY) {
      return await this.executeRepay(xTransactionInput);
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

  async executeDepositCollateral(xTransactionInput: XTransactionInput) {
    const { inputAmount, account, xCallFee } = xTransactionInput;

    if (!inputAmount) {
      return;
    }

    const data = getBytesFromString(JSON.stringify({}));
    const isNative = inputAmount.currency.wrapped.address === NATIVE_ADDRESS;

    if (isNative) {
      const msg = MsgExecuteContractCompat.fromJSON({
        contractAddress: injective.contracts.assetManager,
        sender: account,
        msg: {
          deposit_denom: {
            denom: 'inj',
            to: `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`,
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
    } else {
      throw new Error('Injective tokens not supported yet');
    }
  }

  async executeWithdrawCollateral(xTransactionInput: XTransactionInput) {
    const { inputAmount, account, xCallFee, usedCollateral } = xTransactionInput;

    if (!inputAmount || !usedCollateral) {
      return;
    }

    const amount = toICONDecimals(inputAmount.multiply(-1));

    const envelope = {
      message: {
        call_message: {
          data: Array.from(RLP.encode(['xWithdraw', uintToBytes(amount), usedCollateral])),
        },
      },
      sources: FROM_SOURCES[this.xChainId],
      destinations: TO_SOURCES[this.xChainId],
    };

    const msg = MsgExecuteContractCompat.fromJSON({
      contractAddress: injective.contracts.xCall,
      sender: account,
      msg: {
        send_call: {
          to: `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`,
          envelope,
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
  }

  async executeBorrow(xTransactionInput: XTransactionInput) {
    const { inputAmount, account, xCallFee, usedCollateral, recipient } = xTransactionInput;

    if (!inputAmount || !usedCollateral) {
      return;
    }
    const amount = BigInt(inputAmount.quotient.toString());

    const envelope = {
      message: {
        call_message: {
          data: Array.from(
            RLP.encode(
              recipient
                ? ['xBorrow', usedCollateral, uintToBytes(amount), Buffer.from(recipient)]
                : ['xBorrow', usedCollateral, uintToBytes(amount)],
            ),
          ),
        },
      },
      sources: FROM_SOURCES[this.xChainId],
      destinations: TO_SOURCES[this.xChainId],
    };

    const msg = MsgExecuteContractCompat.fromJSON({
      contractAddress: injective.contracts.xCall,
      sender: account,
      msg: {
        send_call: {
          to: `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`,
          envelope,
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
  }

  async executeRepay(xTransactionInput: XTransactionInput) {
    const { inputAmount, account, xCallFee, usedCollateral, recipient } = xTransactionInput;

    if (!inputAmount || !usedCollateral) {
      return;
    }

    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`;
    const data = getBytesFromString(
      JSON.stringify(recipient ? { _collateral: usedCollateral, _to: recipient } : { _collateral: usedCollateral }),
    );

    const msg = MsgExecuteContractCompat.fromJSON({
      contractAddress: injective.contracts.bnUSD!,
      sender: account,
      msg: {
        cross_transfer: {
          amount: inputAmount.multiply(-1).quotient.toString(),
          to: destination,
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
  }
}
