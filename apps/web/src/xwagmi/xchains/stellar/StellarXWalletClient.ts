import { Percent } from '@balancednetwork/sdk-core';
import bnJs from '../icon/bnJs';

import { ICON_XCALL_NETWORK_ID } from '@/xwagmi/constants';
import { FROM_SOURCES, TO_SOURCES, stellar } from '@/xwagmi/constants/xChains';
import { XWalletClient } from '@/xwagmi/core';
import { XToken } from '@/xwagmi/types';
import { uintToBytes } from '@/xwagmi/utils';
import { XTransactionInput, XTransactionType } from '@/xwagmi/xcall/types';
import { getRlpEncodedSwapData, toICONDecimals } from '@/xwagmi/xcall/utils';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';
import { RLP } from '@ethereumjs/rlp';
import { BASE_FEE, Networks, TransactionBuilder, nativeToScVal } from '@stellar/stellar-sdk';
import CustomSorobanServer from './CustomSorobanServer';
import { StellarXService } from './StellarXService';
import {
  STELLAR_RLP_DATA_TYPE,
  STELLAR_RLP_ENVELOPE_TYPE,
  STELLAR_RLP_MSG_TYPE,
  XLM_CONTRACT_ADDRESS,
  accountToScVal,
  sendTX,
} from './utils';

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
        case XTransactionType.DEPOSIT:
          return await this.handleDepositCollateralTransaction(
            xTransactionInput,
            simulateTxBuilder,
            sorobanServer,
            walletsKit,
          );
        case XTransactionType.WITHDRAW:
          return await this.handleWithdrawCollateralTransaction(
            xTransactionInput,
            simulateTxBuilder,
            sorobanServer,
            walletsKit,
          );
        case XTransactionType.BORROW:
          return await this.handleBorrowTransaction(xTransactionInput, simulateTxBuilder, sorobanServer, walletsKit);
        case XTransactionType.REPAY:
          return await this.handleRepayLoanTransaction(xTransactionInput, simulateTxBuilder, sorobanServer, walletsKit);
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

  private async handleDepositCollateralTransaction(
    xTransactionInput: XTransactionInput,
    txBuilder: TransactionBuilder,
    server: CustomSorobanServer,
    kit: StellarWalletsKit,
  ): Promise<string | undefined> {
    const { inputAmount, account } = xTransactionInput;
    if (!inputAmount) {
      return;
    }

    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`;
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(JSON.stringify({}));

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
    } else {
      throw new Error('Invalid currency for Stellar swap');
    }
  }

  private async handleWithdrawCollateralTransaction(
    xTransactionInput: XTransactionInput,
    txBuilder: TransactionBuilder,
    server: CustomSorobanServer,
    kit: StellarWalletsKit,
  ): Promise<string | undefined> {
    const { inputAmount, account, direction, usedCollateral } = xTransactionInput;
    if (!inputAmount || !usedCollateral) {
      return;
    }

    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`;
    const amount = toICONDecimals(inputAmount.multiply(-1));
    const envelope = {
      destinations: TO_SOURCES[direction.from],
      sources: FROM_SOURCES[direction.from],
      message: [
        nativeToScVal('CallMessage', STELLAR_RLP_MSG_TYPE),
        nativeToScVal({ data: RLP.encode(['xWithdraw', uintToBytes(amount), usedCollateral]) }, STELLAR_RLP_DATA_TYPE),
      ],
    };

    // send_call(tx_origin: address, sender: address, envelope: Envelope, to: string)
    const params = [
      accountToScVal(account),
      accountToScVal(account),
      nativeToScVal(envelope, STELLAR_RLP_ENVELOPE_TYPE),
      nativeToScVal(destination),
    ];

    const hash = await sendTX(stellar.contracts.xCall, 'send_call', params, txBuilder, server, kit);
    return hash;
  }

  private async handleBorrowTransaction(
    xTransactionInput: XTransactionInput,
    txBuilder: TransactionBuilder,
    server: CustomSorobanServer,
    kit: StellarWalletsKit,
  ): Promise<string | undefined> {
    const { inputAmount, account, direction, usedCollateral, recipient } = xTransactionInput;
    if (!inputAmount || !usedCollateral) {
      return;
    }

    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`;
    const amount = BigInt(inputAmount.quotient.toString());
    const data = RLP.encode(
      recipient
        ? ['xBorrow', usedCollateral, uintToBytes(amount), Buffer.from(recipient)]
        : ['xBorrow', usedCollateral, uintToBytes(amount)],
    );
    const envelope = {
      destinations: TO_SOURCES[direction.from],
      sources: FROM_SOURCES[direction.from],
      message: [nativeToScVal('CallMessage', STELLAR_RLP_MSG_TYPE), nativeToScVal({ data }, STELLAR_RLP_DATA_TYPE)],
    };

    // send_call(tx_origin: address, sender: address, envelope: Envelope, to: string)
    const params = [
      accountToScVal(account),
      accountToScVal(account),
      nativeToScVal(envelope, STELLAR_RLP_ENVELOPE_TYPE),
      nativeToScVal(destination),
    ];

    const hash = await sendTX(stellar.contracts.xCall, 'send_call', params, txBuilder, server, kit);
    return hash;
  }

  private async handleRepayLoanTransaction(
    xTransactionInput: XTransactionInput,
    txBuilder: TransactionBuilder,
    server: CustomSorobanServer,
    kit: StellarWalletsKit,
  ): Promise<string | undefined> {
    const { inputAmount, account, usedCollateral, recipient } = xTransactionInput;
    if (!inputAmount || !usedCollateral) {
      return;
    }
    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`;
    const dataObj = recipient ? { _collateral: usedCollateral, _to: recipient } : { _collateral: usedCollateral };

    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(JSON.stringify(dataObj));

    if (inputAmount.currency.symbol === 'bnUSD') {
      //cross_transfer(from: address, amount: u128, to: string, data: option<bytes>)
      const params = [
        accountToScVal(account),
        nativeToScVal(inputAmount.multiply(-1).quotient, { type: 'u128' }),
        nativeToScVal(destination),
        nativeToScVal(uint8Array, { type: 'bytes' }),
      ];

      const hash = await sendTX(stellar.contracts.bnUSD!, 'cross_transfer', params, txBuilder, server, kit);
      return hash;
    } else {
      throw new Error('Invalid currency for Stellar repay loan');
    }
  }
}
