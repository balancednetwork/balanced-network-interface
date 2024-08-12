import bnJs from '@/bnJs';
import { Percent } from '@balancednetwork/sdk-core';

import { getBytesFromString, getRlpEncodedSwapData, toICONDecimals } from '@/app/pages/trade/bridge/utils';
import { FROM_SOURCES, injective, TO_SOURCES } from '@/app/pages/trade/bridge/_config/xChains';
import { getFeeParam, isDenomAsset } from '@/packages/archway/utils';
import { XChainId, XToken } from '@/app/pages/trade/bridge/types';
import { IWalletXService } from './types';
import { XTransactionInput, XTransactionType } from '../_zustand/types';
import { CurrencyAmount, MaxUint256 } from '@balancednetwork/sdk-core';
import { ICON_XCALL_NETWORK_ID } from '@/constants/config';
import { InjectivePublicXService } from './InjectivePublicXService';

import { MsgExecuteContractCompat } from '@injectivelabs/sdk-ts';
import { Network, getNetworkEndpoints } from '@injectivelabs/networks';
import { MsgBroadcaster } from '@injectivelabs/wallet-ts';
import { walletStrategy } from '@/packages/injective';
import { toHex } from 'viem';
import { NATIVE_ADDRESS } from '@/constants';
import { RLP } from '@ethereumjs/rlp';
import { uintToBytes } from '@/utils';

export const NETWORK = Network.Mainnet;
export const ENDPOINTS = getNetworkEndpoints(NETWORK);

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
    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`;
    const data = toHex(RLP.encode(['xWithdraw', uintToBytes(amount), usedCollateral]));
    // const envelope = toHex(
    //   RLP.encode([
    //     Buffer.from([0]),
    //     data,
    //     FROM_SOURCES[this.xChainId]?.map(Buffer.from),
    //     TO_SOURCES[this.xChainId]?.map(Buffer.from),
    //   ]),
    // );

    const envelope = {
      message: {
        call_message: {
          data: RLP.encode(['xWithdraw', uintToBytes(amount), usedCollateral]),
        },
      },
      sources: ['inj15jcde723hrm5f4fx3r2stnq59jykt2askud8ht'],
      destinations: ['cx6f86ed848f9f0d03ba1220811d95d864c72da88c'],
    };

    console.log('envelopeeee', envelope);

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
          amount: BigInt(xCallFee.rollback).toString(),
        },
      ],
    });

    console.log('msggg', msg);

    const txResult = await msgBroadcastClient.broadcastWithFeeDelegation({
      msgs: msg,
      injectiveAddress: account,
    });

    return txResult.txHash;

    // const res = await this.publicClient.simulateContract({
    //   account: account as Address,
    //   address: xChainMap[this.xChainId].contracts.xCall as Address,
    //   abi: xCallContractAbi,
    //   functionName: 'sendCall',
    //   args: [destination, envelope],
    //   //todo
    //   //? rollback or not
    //   value: xCallFee.noRollback,
    // });

    // const request = res.request;
    // const hash = await this.walletClient.writeContract(request);

    // if (hash) {
    //   return hash;
    // }
  }

  async executeBorrow(xTransactionInput: XTransactionInput) {
    const { inputAmount, account, xCallFee, usedCollateral, recipient } = xTransactionInput;

    if (!inputAmount || !usedCollateral) {
      return;
    }

    if (this.walletClient) {
      const amount = BigInt(inputAmount.quotient.toString());
      const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`;
      const data = toHex(
        RLP.encode(
          recipient
            ? ['xBorrow', usedCollateral, uintToBytes(amount), Buffer.from(recipient)]
            : ['xBorrow', usedCollateral, uintToBytes(amount)],
        ),
      );
      const envelope = toHex(
        RLP.encode([
          Buffer.from([0]),
          data,
          FROM_SOURCES[this.xChainId]?.map(Buffer.from),
          TO_SOURCES[this.xChainId]?.map(Buffer.from),
        ]),
      );

      // const res = await this.publicClient.simulateContract({
      //   account: account as Address,
      //   address: xChainMap[this.xChainId].contracts.xCall as Address,
      //   abi: xCallContractAbi,
      //   functionName: 'sendCall',
      //   args: [destination, envelope],
      //   //todo
      //   //? rollback or not
      //   value: xCallFee.noRollback,
      // });

      // const request: WriteContractParameters = res.request;
      // const hash = await this.walletClient.writeContract(request);

      // if (hash) {
      //   return hash;
      // }
      return '';
    }
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
