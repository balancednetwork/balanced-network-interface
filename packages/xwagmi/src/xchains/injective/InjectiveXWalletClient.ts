import { FROM_SOURCES, TO_SOURCES, injective } from '@/constants/xChains';
import { XWalletClient } from '@/core';
import { DepositParams, SendCallParams } from '@/core/XWalletClient';
import { XToken } from '@/types';
import { MsgExecuteContractCompat } from '@injectivelabs/sdk-ts';
import { isDenomAsset } from '../archway/utils';
import { InjectiveXService } from './InjectiveXService';

export class InjectiveXWalletClient extends XWalletClient {
  getXService(): InjectiveXService {
    return InjectiveXService.getInstance();
  }

  async approve(amountToApprove, spender, owner) {
    return Promise.resolve(undefined);
  }

  async _deposit({ account, inputAmount, destination, data, fee }: DepositParams) {
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
            data: Array.from(data),
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
            data: Array.from(data),
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

  async _crossTransfer({ account, inputAmount, destination, data, fee }: DepositParams) {
    const amount = inputAmount.quotient.toString();
    const msg = MsgExecuteContractCompat.fromJSON({
      contractAddress: injective.contracts.bnUSD!,
      sender: account,
      msg: {
        cross_transfer: {
          amount,
          to: destination,
          data: Array.from(data),
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

  async _sendCall({ account, sourceChainId, destination, data, fee }: SendCallParams) {
    const envelope = {
      message: {
        call_message: {
          data: Array.from(data),
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
}
