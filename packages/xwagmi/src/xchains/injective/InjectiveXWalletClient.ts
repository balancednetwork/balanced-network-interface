import { CurrencyAmount, Percent, XChainId } from '@balancednetwork/sdk-core';
import bnJs from '../icon/bnJs';

import { ICON_XCALL_NETWORK_ID } from '@/constants';
import { getBytesFromString, getRlpEncodedSwapData, toICONDecimals } from '@/xcall/utils';

import { FROM_SOURCES, TO_SOURCES, injective } from '@/constants/xChains';
import { XWalletClient } from '@/core';
import { XToken } from '@/types';
import { uintToBytes } from '@/utils';
import { XTransactionInput, XTransactionType } from '@/xcall/types';
import { RLP } from '@ethereumjs/rlp';
import { MsgExecuteContractCompat } from '@injectivelabs/sdk-ts';
import { isDenomAsset, isSpokeToken } from '../archway/utils';
import { InjectiveXService } from './InjectiveXService';

export class InjectiveXWalletClient extends XWalletClient {
  getXService(): InjectiveXService {
    return InjectiveXService.getInstance();
  }

  async approve(amountToApprove, spender, owner) {
    return Promise.resolve(undefined);
  }

  private async _deposit({
    account,
    inputAmount,
    destination,
    data,
    fee,
  }: {
    account: string;
    inputAmount: CurrencyAmount<XToken>;
    destination: string;
    data: any;
    fee: bigint;
  }) {
    let msg;
    const isDenom = inputAmount && inputAmount.currency instanceof XToken ? isDenomAsset(inputAmount.currency) : false;
    if (isDenom) {
      msg = MsgExecuteContractCompat.fromJSON({
        contractAddress: injective.contracts.assetManager,
        sender: account,
        msg: {
          deposit_denom: {
            denom: inputAmount.currency.address,
            to: destination,
            data,
          },
        },
        funds: [
          {
            denom: 'inj',
            amount: BigInt(fee).toString(),
          },
          { denom: inputAmount.currency.address, amount: `${inputAmount.quotient}` },
        ],
      });
    } else {
      msg = MsgExecuteContractCompat.fromJSON({
        contractAddress: injective.contracts.assetManager,
        sender: account,
        msg: {
          deposit_denom: {
            denom: 'inj',
            to: destination,
            data,
          },
        },
        funds: [
          {
            denom: 'inj',
            amount: BigInt(inputAmount.quotient + fee).toString(),
          },
        ],
      });
    }

    const txResult = await this.getXService().msgBroadcastClient.broadcastWithFeeDelegation({
      msgs: msg,
      injectiveAddress: account,
    });

    return txResult.txHash;
  }

  private async _crossTransfer({
    account,
    inputAmount,
    destination,
    data,
    fee,
  }: {
    account: string;
    inputAmount: CurrencyAmount<XToken>;
    destination: string;
    data: any;
    fee: bigint;
  }) {
    const amount = inputAmount.quotient.toString();
    const msg = MsgExecuteContractCompat.fromJSON({
      contractAddress: injective.contracts.bnUSD!,
      sender: account,
      msg: {
        cross_transfer: {
          amount,
          to: destination,
          data,
        },
      },
      funds: [
        {
          denom: 'inj',
          amount: fee.toString(),
        },
        { denom: inputAmount.currency.address, amount },
      ],
    });

    const txResult = await this.getXService().msgBroadcastClient.broadcastWithFeeDelegation({
      msgs: msg,
      injectiveAddress: account,
    });

    return txResult.txHash;
  }

  private async _sendCall({
    account,
    sourceChainId,
    destination,
    data,
    fee,
  }: {
    account: string;
    sourceChainId: XChainId;
    destination: string;
    data: any;
    fee: bigint;
  }) {
    const envelope = {
      message: {
        call_message: {
          data,
        },
      },
      sources: FROM_SOURCES[sourceChainId],
      destinations: TO_SOURCES[sourceChainId],
    };

    const msg = MsgExecuteContractCompat.fromJSON({
      contractAddress: injective.contracts.xCall,
      sender: account,
      msg: {
        send_call: {
          to: destination,
          envelope,
        },
      },
      funds: [
        {
          denom: 'inj',
          amount: fee.toString(),
        },
      ],
    });

    const txResult = await this.getXService().msgBroadcastClient.broadcastWithFeeDelegation({
      msgs: msg,
      injectiveAddress: account,
    });

    return txResult.txHash;
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

  async executeDepositCollateral(xTransactionInput: XTransactionInput) {
    const { inputAmount, account, xCallFee } = xTransactionInput;

    if (!inputAmount) {
      return;
    }

    const data = getBytesFromString(JSON.stringify({}));

    return await this._deposit({
      account,
      inputAmount,
      destination: `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`,
      data,
      fee: xCallFee.rollback,
    });
  }

  async executeWithdrawCollateral(xTransactionInput: XTransactionInput) {
    const { inputAmount, account, xCallFee, usedCollateral } = xTransactionInput;

    if (!inputAmount || !usedCollateral) {
      return;
    }

    const amount = toICONDecimals(inputAmount.multiply(-1));
    const data = Array.from(RLP.encode(['xWithdraw', uintToBytes(amount), usedCollateral]));

    return await this._sendCall({
      account,
      sourceChainId: this.xChainId,
      destination: `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`,
      data,
      fee: xCallFee.rollback,
    });
  }

  async executeBorrow(xTransactionInput: XTransactionInput) {
    const { inputAmount, account, xCallFee, usedCollateral, recipient } = xTransactionInput;

    if (!inputAmount || !usedCollateral) {
      return;
    }
    const amount = BigInt(inputAmount.quotient.toString());
    const data = Array.from(
      RLP.encode(
        recipient
          ? ['xBorrow', usedCollateral, uintToBytes(amount), Buffer.from(recipient)]
          : ['xBorrow', usedCollateral, uintToBytes(amount)],
      ),
    );

    return await this._sendCall({
      account,
      sourceChainId: this.xChainId,
      destination: `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`,
      data,
      fee: xCallFee.rollback,
    });
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

    return await this._crossTransfer({
      account,
      inputAmount: inputAmount.multiply(-1),
      destination,
      data,
      fee: xCallFee.rollback,
    });
  }

  async depositXToken(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }
  async withdrawXToken(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }
  async addLiquidity(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }
  async removeLiquidity(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }
  async stake(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }
  async unstake(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }
  async claimRewards(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }
}
