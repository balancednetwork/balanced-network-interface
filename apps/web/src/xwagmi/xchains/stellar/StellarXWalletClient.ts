import { Percent } from '@balancednetwork/sdk-core';
import bnJs from '../icon/bnJs';

import { ICON_XCALL_NETWORK_ID, NATIVE_ADDRESS } from '@/xwagmi/constants';
import { FROM_SOURCES, TO_SOURCES, stellar } from '@/xwagmi/constants/xChains';
import { XWalletClient } from '@/xwagmi/core';
import { XToken } from '@/xwagmi/types';
import { uintToBytes } from '@/xwagmi/utils';
import { XTransactionInput, XTransactionType } from '@/xwagmi/xcall/types';
import { getBytesFromString, getRlpEncodedSwapData, toICONDecimals } from '@/xwagmi/xcall/utils';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { RLP } from '@ethereumjs/rlp';
import {
  Asset,
  BASE_FEE,
  Contract,
  Keypair,
  Networks,
  Operation,
  OperationOptions,
  SorobanRpc,
  TransactionBuilder,
  nativeToScVal,
  rpc,
  xdr,
} from '@stellar/stellar-sdk';
import { StellarXService } from './StellarXService';
import { XLM_CONTRACT_ADDRESS, accountToScVal, numberToI128 } from './utils';

export class StellarXWalletClient extends XWalletClient {
  getXService(): StellarXService {
    return StellarXService.getInstance();
  }

  async approve(token: XToken, owner: string, spender: string, currencyAmountToApprove: CurrencyAmount<XToken>) {}

  async executeTransaction(xTransactionInput: XTransactionInput) {
    const { type, direction, inputAmount, executionTrade, account, recipient, xCallFee, slippageTolerance } =
      xTransactionInput;

    const stellarAccount = await this.getXService().server.loadAccount(account);
    const sorobanServer = this.getXService().sorobanServer;
    const walletsKit = this.getXService().walletsKit;

    const simulateTxBuilder = new TransactionBuilder(stellarAccount, {
      fee: BASE_FEE,
      networkPassphrase: Networks.PUBLIC,
    });

    if (type === XTransactionType.BRIDGE) {
      const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Router.address}`;

      if (inputAmount.currency.symbol === 'XLM') {
      } else {
        const contract = new Contract(stellar.contracts.bnUSD!);

        const dataObj = {
          method: '_swap',
          params: {
            path: [],
            receiver: recipient,
          },
        };

        const encoder = new TextEncoder();
        const uint8Array = encoder.encode(JSON.stringify(dataObj));

        //cross_transfer(from: address, amount: u128, to: string, data: option<bytes>)
        const params = [
          accountToScVal(account),
          nativeToScVal(inputAmount.quotient, { type: 'u128' }),
          nativeToScVal(destination),
          nativeToScVal(uint8Array, { type: 'bytes' }),
        ];

        const simulateTx = simulateTxBuilder
          .addOperation(contract.call('cross_transfer', ...params))
          .setTimeout(30)
          .build();

        const simResult = await sorobanServer.simulateTransaction(simulateTx);

        const tx = rpc.assembleTransaction(simulateTx, simResult).build();

        if (tx) {
          const { signedTxXdr } = await walletsKit.signTransaction(tx.toXDR());
          const txToSubmit = TransactionBuilder.fromXDR(signedTxXdr, Networks.PUBLIC);

          const { hash } = await sorobanServer.sendTransaction(txToSubmit);
          console.log('txResponse', hash);
          return hash;
        } else {
          throw new Error('Failed to assemble stellar transaction');
        }
      }
    }

    return '';

    // const token = inputAmount.currency.wrapped;
    // const receiver = `${direction.to}/${recipient}`;

    // let data;
    // if (type === XTransactionType.SWAP) {
    //   if (!executionTrade || !slippageTolerance) {
    //     return;
    //   }

    //   const minReceived = executionTrade.minimumAmountOut(new Percent(slippageTolerance, 10_000));
    //   const rlpEncodedData = getRlpEncodedSwapData(executionTrade, '_swap', receiver, minReceived);
    //   data = Array.from(rlpEncodedData);
    // } else if (type === XTransactionType.BRIDGE) {
    //   data = getBytesFromString(
    //     JSON.stringify({
    //       method: '_swap',
    //       params: {
    //         path: [],
    //         receiver: receiver,
    //       },
    //     }),
    //   );
    // } else if (type === XTransactionType.DEPOSIT) {
    //   return await this.executeDepositCollateral(xTransactionInput);
    // } else if (type === XTransactionType.WITHDRAW) {
    //   return await this.executeWithdrawCollateral(xTransactionInput);
    // } else if (type === XTransactionType.BORROW) {
    //   return await this.executeBorrow(xTransactionInput);
    // } else if (type === XTransactionType.REPAY) {
    //   return await this.executeRepay(xTransactionInput);
    // } else {
    //   throw new Error('Invalid XTransactionType');
    // }

    // const isBnUSD = inputAmount.currency?.symbol === 'bnUSD';

    // if (isBnUSD) {

    //   return '';
    // } else {

    //   return '';
    // }
  }

  async executeDepositCollateral(xTransactionInput: XTransactionInput) {
    // const { inputAmount, account, xCallFee } = xTransactionInput;
    // if (!inputAmount) {
    //   return;
    // }
    // const data = getBytesFromString(JSON.stringify({}));
    // const isNative = inputAmount.currency.wrapped.address === NATIVE_ADDRESS;
    // if (isNative) {
    //   const msg = MsgExecuteContractCompat.fromJSON({
    //     contractAddress: stellar.contracts.assetManager,
    //     sender: account,
    //     msg: {
    //       deposit_denom: {
    //         denom: 'inj',
    //         to: `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`,
    //         data,
    //       },
    //     },
    //     funds: [
    //       {
    //         denom: 'inj',
    //         amount: BigInt(inputAmount.quotient + xCallFee.rollback).toString(),
    //       },
    //     ],
    //   });
    //   const txResult = await this.getXService().msgBroadcastClient.broadcastWithFeeDelegation({
    //     msgs: msg,
    //     stellarAddress: account,
    //   });
    //   return txResult.txHash;
    // } else {
    //   throw new Error('Stellar tokens not supported yet');
    // }
  }

  async executeWithdrawCollateral(xTransactionInput: XTransactionInput) {
    // const { inputAmount, account, xCallFee, usedCollateral } = xTransactionInput;
    // if (!inputAmount || !usedCollateral) {
    //   return;
    // }
    // const amount = toICONDecimals(inputAmount.multiply(-1));
    // const envelope = {
    //   message: {
    //     call_message: {
    //       data: Array.from(RLP.encode(['xWithdraw', uintToBytes(amount), usedCollateral])),
    //     },
    //   },
    //   sources: FROM_SOURCES[this.xChainId],
    //   destinations: TO_SOURCES[this.xChainId],
    // };
    // const msg = MsgExecuteContractCompat.fromJSON({
    //   contractAddress: stellar.contracts.xCall,
    //   sender: account,
    //   msg: {
    //     send_call: {
    //       to: `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`,
    //       envelope,
    //     },
    //   },
    //   funds: [
    //     {
    //       denom: 'inj',
    //       amount: xCallFee.rollback.toString(),
    //     },
    //   ],
    // });
    // const txResult = await this.getXService().msgBroadcastClient.broadcastWithFeeDelegation({
    //   msgs: msg,
    //   stellarAddress: account,
    // });
    // return txResult.txHash;
  }

  async executeBorrow(xTransactionInput: XTransactionInput) {
    // const { inputAmount, account, xCallFee, usedCollateral, recipient } = xTransactionInput;
    // if (!inputAmount || !usedCollateral) {
    //   return;
    // }
    // const amount = BigInt(inputAmount.quotient.toString());
    // const envelope = {
    //   message: {
    //     call_message: {
    //       data: Array.from(
    //         RLP.encode(
    //           recipient
    //             ? ['xBorrow', usedCollateral, uintToBytes(amount), Buffer.from(recipient)]
    //             : ['xBorrow', usedCollateral, uintToBytes(amount)],
    //         ),
    //       ),
    //     },
    //   },
    //   sources: FROM_SOURCES[this.xChainId],
    //   destinations: TO_SOURCES[this.xChainId],
    // };
    // const msg = MsgExecuteContractCompat.fromJSON({
    //   contractAddress: stellar.contracts.xCall,
    //   sender: account,
    //   msg: {
    //     send_call: {
    //       to: `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`,
    //       envelope,
    //     },
    //   },
    //   funds: [
    //     {
    //       denom: 'inj',
    //       amount: xCallFee.rollback.toString(),
    //     },
    //   ],
    // });
    // const txResult = await this.getXService().msgBroadcastClient.broadcastWithFeeDelegation({
    //   msgs: msg,
    //   stellarAddress: account,
    // });
    // return txResult.txHash;
  }

  async executeRepay(xTransactionInput: XTransactionInput) {
    // const { inputAmount, account, xCallFee, usedCollateral, recipient } = xTransactionInput;
    // if (!inputAmount || !usedCollateral) {
    //   return;
    // }
    // const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`;
    // const data = getBytesFromString(
    //   JSON.stringify(recipient ? { _collateral: usedCollateral, _to: recipient } : { _collateral: usedCollateral }),
    // );
    // const msg = MsgExecuteContractCompat.fromJSON({
    //   contractAddress: stellar.contracts.bnUSD!,
    //   sender: account,
    //   msg: {
    //     cross_transfer: {
    //       amount: inputAmount.multiply(-1).quotient.toString(),
    //       to: destination,
    //       data,
    //     },
    //   },
    //   funds: [
    //     {
    //       denom: 'inj',
    //       amount: xCallFee.rollback.toString(),
    //     },
    //   ],
    // });
    // const txResult = await this.getXService().msgBroadcastClient.broadcastWithFeeDelegation({
    //   msgs: msg,
    //   stellarAddress: account,
    // });
    // return txResult.txHash;
  }
}
