import { ICON_XCALL_NETWORK_ID } from '@/constants';
import { FROM_SOURCES, TO_SOURCES, injective } from '@/constants/xChains';
import { xTokenMap } from '@/constants/xTokens';
import { XWalletClient } from '@/core';
import { uintToBytes } from '@/utils';
import { XTransactionInput, XTransactionType } from '@/xcall/types';
import { getBytesFromString, getRlpEncodedSwapData, toICONDecimals } from '@/xcall/utils';
import { RLP } from '@ethereumjs/rlp';
import { MsgExecuteContractCompat } from '@injectivelabs/sdk-ts';
import { isDenomAsset, isSpokeToken } from '../archway/utils';
import bnJs from '../icon/bnJs';
import { InjectiveXService } from './InjectiveXService';

export class InjectiveXWalletClient extends XWalletClient {
  getXService(): InjectiveXService {
    return InjectiveXService.getInstance();
  }

  async approve(amountToApprove, spender, owner) {
    return Promise.resolve(undefined);
  }

  async executeTransaction(xTransactionInput: XTransactionInput) {
    const { type, direction, inputAmount, account, recipient, xCallFee, minReceived, path } = xTransactionInput;

    const token = inputAmount.currency.wrapped;
    const receiver = `${direction.to}/${recipient}`;

    let data;
    if (type === XTransactionType.SWAP) {
      if (!minReceived || !path) {
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

    const _isSpokeToken = isSpokeToken(inputAmount.currency);
    const isDenom = isDenomAsset(inputAmount.currency);

    if (_isSpokeToken) {
      const amount = inputAmount.quotient.toString();
      const msg = MsgExecuteContractCompat.fromJSON({
        contractAddress: token.address.replace('factory/inj14ejqjyq8um4p3xfqj74yld5waqljf88f9eneuk/', ''),
        sender: account,
        msg: {
          cross_transfer: {
            amount,
            to: `${ICON_XCALL_NETWORK_ID}/${bnJs.Router.address}`,
            data,
          },
        },
        funds: [
          {
            denom: 'inj',
            amount: xCallFee.rollback.toString(),
          },
          { denom: token.address, amount },
        ],
      });

      const txResult = await this.getXService().msgBroadcastClient.broadcastWithFeeDelegation({
        msgs: msg,
        injectiveAddress: account,
      });

      return txResult.txHash;
    } else {
      let msg;
      if (isDenom) {
        msg = MsgExecuteContractCompat.fromJSON({
          contractAddress: injective.contracts.assetManager,
          sender: account,
          msg: {
            deposit_denom: {
              denom: token.address,
              to: `${ICON_XCALL_NETWORK_ID}/${bnJs.Router.address}`,
              data,
            },
          },
          funds: [
            {
              denom: 'inj',
              amount: BigInt(xCallFee.rollback).toString(),
            },
            { denom: token.address, amount: `${inputAmount.quotient}` },
          ],
        });
      } else {
        msg = MsgExecuteContractCompat.fromJSON({
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
      }

      const txResult = await this.getXService().msgBroadcastClient.broadcastWithFeeDelegation({
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

    if (inputAmount.currency.isNativeToken) {
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

      const txResult = await this.getXService().msgBroadcastClient.broadcastWithFeeDelegation({
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

    const txResult = await this.getXService().msgBroadcastClient.broadcastWithFeeDelegation({
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

    const txResult = await this.getXService().msgBroadcastClient.broadcastWithFeeDelegation({
      msgs: msg,
      injectiveAddress: account,
    });

    return txResult.txHash;
  }

  async executeRepay(xTransactionInput: XTransactionInput) {
    const { inputAmount, account, xCallFee, usedCollateral, recipient } = xTransactionInput;

    const bnUSD = xTokenMap['injective-1'].find(xToken => xToken.symbol === 'bnUSD');
    if (!inputAmount || !usedCollateral || !bnUSD) {
      return;
    }

    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`;
    const data = getBytesFromString(
      JSON.stringify(recipient ? { _collateral: usedCollateral, _to: recipient } : { _collateral: usedCollateral }),
    );
    const amount = inputAmount.multiply(-1).quotient.toString();

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
          amount: xCallFee.rollback.toString(),
        },
        { denom: bnUSD.address, amount },
      ],
    });

    const txResult = await this.getXService().msgBroadcastClient.broadcastWithFeeDelegation({
      msgs: msg,
      injectiveAddress: account,
    });

    return txResult.txHash;
  }
}
