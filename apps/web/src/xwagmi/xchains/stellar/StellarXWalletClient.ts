import { Percent } from '@balancednetwork/sdk-core';
import bnJs from '../icon/bnJs';

import { ICON_XCALL_NETWORK_ID, NATIVE_ADDRESS } from '@/xwagmi/constants';
import { stellar } from '@/xwagmi/constants/xChains';
import { XWalletClient } from '@/xwagmi/core';
import { XToken } from '@/xwagmi/types';
import { XTransactionInput, XTransactionType } from '@/xwagmi/xcall/types';
import { getRlpEncodedSwapData } from '@/xwagmi/xcall/utils';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';
import { BASE_FEE, Networks, TransactionBuilder, nativeToScVal } from '@stellar/stellar-sdk';
import CustomSorobanServer from './CustomSorobanServer';
import { StellarXService } from './StellarXService';
import { XLM_CONTRACT_ADDRESS, accountToScVal, sendTX } from './utils';

export class StellarXWalletClient extends XWalletClient {
  getXService(): StellarXService {
    return StellarXService.getInstance();
  }

  async approve(token: XToken, owner: string, spender: string, currencyAmountToApprove: CurrencyAmount<XToken>) {}

  async executeTransaction(xTransactionInput: XTransactionInput) {
    const { type, account } = xTransactionInput;
    const stellarAccount = await this.getXService().server.loadAccount(account);
    const sorobanServer = this.getXService().sorobanServer;
    const walletsKit = this.getXService().walletsKit;
    const simulateTxBuilder = new TransactionBuilder(stellarAccount, {
      fee: BASE_FEE,
      networkPassphrase: Networks.PUBLIC,
    });

    try {
      switch (type) {
        case XTransactionType.BRIDGE:
          return await this.handleBridgeTransaction(xTransactionInput, simulateTxBuilder, sorobanServer, walletsKit);
        case XTransactionType.SWAP:
          return await this.handleSwapTransaction(xTransactionInput, simulateTxBuilder, sorobanServer, walletsKit);
        case XTransactionType.WITHDRAW:
          return ''; // Implement withdraw logic
        case XTransactionType.BORROW:
          return ''; // Implement borrow logic
        case XTransactionType.REPAY:
          return ''; // Implement repay
        case XTransactionType.DEPOSIT:
          return ''; // Implement deposit
        default:
          throw new Error('Unsupported transaction type');
      }
    } catch (error) {
      console.error('Error executing Stellar transaction:', error);
      throw new Error(`Error executing Stellar transaction: ${error}`);
    }
  }

  private async handleBridgeTransaction(
    xTransactionInput: XTransactionInput,
    txBuilder: TransactionBuilder,
    server: CustomSorobanServer,
    kit: StellarWalletsKit,
  ): Promise<string | undefined> {
    const { account, inputAmount, recipient, direction } = xTransactionInput;
    const receiver = `${direction.to}/${recipient}`;
    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Router.address}`;
    const dataObj = {
      method: '_swap',
      params: {
        path: [],
        receiver,
      },
    };
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(JSON.stringify(dataObj));

    if (inputAmount.currency.symbol === 'XLM') {
      //deposit(from: address, token: address, amount: u128, to: option<string>, data: option<bytes>)
      const params = [
        accountToScVal(account),
        nativeToScVal(XLM_CONTRACT_ADDRESS, { type: 'address' }),
        nativeToScVal(inputAmount.quotient, { type: 'u128' }),
        nativeToScVal(destination),
        nativeToScVal(uint8Array, { type: 'bytes' }),
      ];

      const hash = await sendTX(stellar.contracts.assetManager, 'deposit', params, txBuilder, server, kit);
      return hash;
    } else if (inputAmount.currency.symbol === 'bnUSD') {
      //cross_transfer(from: address, amount: u128, to: string, data: option<bytes>)
      const params = [
        accountToScVal(account),
        nativeToScVal(inputAmount.quotient, { type: 'u128' }),
        nativeToScVal(destination),
        nativeToScVal(uint8Array, { type: 'bytes' }),
      ];

      const hash = await sendTX(stellar.contracts.bnUSD!, 'cross_transfer', params, txBuilder, server, kit);
      return hash;
    } else {
      throw new Error('Invalid currency for Stellar bridge');
    }
  }

  private async handleSwapTransaction(
    xTransactionInput: XTransactionInput,
    txBuilder: TransactionBuilder,
    server: CustomSorobanServer,
    kit: StellarWalletsKit,
  ): Promise<string | undefined> {
    const { inputAmount, executionTrade, account, recipient, direction, slippageTolerance } = xTransactionInput;
    const receiver = `${direction.to}/${recipient}`;

    if (!executionTrade || !slippageTolerance) {
      return;
    }

    const minReceived = executionTrade.minimumAmountOut(new Percent(slippageTolerance, 10_000));
    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Router.address}`;
    const rlpEncodedData = getRlpEncodedSwapData(executionTrade, '_swap', receiver, minReceived);
    const uint8Array = new Uint8Array(rlpEncodedData);

    if (inputAmount.currency.symbol === 'XLM') {
      //deposit(from: address, token: address, amount: u128, to: option<string>, data: option<bytes>)
      const params = [
        accountToScVal(account),
        nativeToScVal(XLM_CONTRACT_ADDRESS, { type: 'address' }),
        nativeToScVal(inputAmount.quotient, { type: 'u128' }),
        nativeToScVal(destination),
        nativeToScVal(uint8Array, { type: 'bytes' }),
      ];

      const hash = await sendTX(stellar.contracts.assetManager, 'deposit', params, txBuilder, server, kit);
      return hash;
    } else if (inputAmount.currency.symbol === 'bnUSD') {
      //cross_transfer(from: address, amount: u128, to: string, data: option<bytes>)
      const params = [
        accountToScVal(account),
        nativeToScVal(inputAmount.quotient, { type: 'u128' }),
        nativeToScVal(destination),
        nativeToScVal(uint8Array, { type: 'bytes' }),
      ];

      const hash = await sendTX(inputAmount.currency.wrapped.address, 'cross_transfer', params, txBuilder, server, kit);
      return hash;
    } else {
      throw new Error('Invalid currency for Stellar swap');
    }
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
