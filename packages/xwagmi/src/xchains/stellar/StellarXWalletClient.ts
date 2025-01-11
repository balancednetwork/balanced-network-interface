import { Percent } from '@balancednetwork/sdk-core';
import bnJs from '../icon/bnJs';

import { ICON_XCALL_NETWORK_ID } from '@/constants';
import { FROM_SOURCES, TO_SOURCES, stellar } from '@/constants/xChains';
import { XWalletClient } from '@/core';
import { DepositParams, SendCallParams } from '@/core/XWalletClient';
import { uintToBytes } from '@/utils';
import { XTransactionInput, XTransactionType } from '@/xcall/types';
import { getRlpEncodedSwapData, toICONDecimals } from '@/xcall/utils';
import { RLP } from '@ethereumjs/rlp';
import { BASE_FEE, Networks, TransactionBuilder, nativeToScVal } from '@stellar/stellar-sdk';
import { isSpokeToken } from '../archway/utils';
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

  async approve(amountToApprove, spender, owner) {
    return Promise.resolve(undefined);
  }

  async _deposit({ account, inputAmount, destination, data, fee }: DepositParams) {
    const stellarAccount = await this.getXService().server.loadAccount(account);
    const server = this.getXService().sorobanServer;
    const kit = this.getXService().walletsKit;
    const txBuilder = new TransactionBuilder(stellarAccount, {
      fee: BASE_FEE,
      networkPassphrase: Networks.PUBLIC,
    });

    const params = [
      accountToScVal(account),
      nativeToScVal(XLM_CONTRACT_ADDRESS, { type: 'address' }),
      nativeToScVal(inputAmount.quotient, { type: 'u128' }),
      nativeToScVal(destination),
      nativeToScVal(data, { type: 'bytes' }),
    ];

    const hash = await sendTX(stellar.contracts.assetManager, 'deposit', params, txBuilder, server, kit);
    return hash;
  }

  async _crossTransfer({ account, inputAmount, destination, data, fee }: DepositParams) {
    const stellarAccount = await this.getXService().server.loadAccount(account);
    const server = this.getXService().sorobanServer;
    const kit = this.getXService().walletsKit;
    const txBuilder = new TransactionBuilder(stellarAccount, {
      fee: BASE_FEE,
      networkPassphrase: Networks.PUBLIC,
    });

    const params = [
      accountToScVal(account),
      nativeToScVal(inputAmount.quotient, { type: 'u128' }),
      nativeToScVal(destination),
      nativeToScVal(data, { type: 'bytes' }),
    ];

    const hash = await sendTX(inputAmount.currency.wrapped.address, 'cross_transfer', params, txBuilder, server, kit);
    return hash;
  }

  async _sendCall({ account, sourceChainId, destination, data, fee }: SendCallParams) {
    const stellarAccount = await this.getXService().server.loadAccount(account);
    const server = this.getXService().sorobanServer;
    const kit = this.getXService().walletsKit;
    const txBuilder = new TransactionBuilder(stellarAccount, {
      fee: BASE_FEE,
      networkPassphrase: Networks.PUBLIC,
    });

    const envelope = {
      destinations: TO_SOURCES[sourceChainId],
      sources: FROM_SOURCES[sourceChainId],
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

  async executeSwapOrBridge(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    if (xTransactionInput.type === XTransactionType.BRIDGE) {
      return await this.handleBridgeTransaction(xTransactionInput);
    } else if (xTransactionInput.type === XTransactionType.SWAP) {
      return await this.handleSwapTransaction(xTransactionInput);
    } else {
      throw new Error('Invalid XTransactionType');
    }
  }

  async handleBridgeTransaction(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    const { account, inputAmount, recipient, direction } = xTransactionInput;
    const receiver = `${direction.to}/${recipient}`;
    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Router.address}`;
    const dataObj = { method: '_swap', params: { path: [], receiver } };
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(dataObj));

    if (isSpokeToken(inputAmount.currency)) {
      return await this._crossTransfer({ account, inputAmount, destination, data, fee: 0n });
    } else {
      return await this._deposit({ account, inputAmount, destination, data, fee: 0n });
    }
  }

  async handleSwapTransaction(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    const { inputAmount, executionTrade, account, recipient, direction, slippageTolerance } = xTransactionInput;
    const receiver = `${direction.to}/${recipient}`;

    if (!executionTrade || !slippageTolerance) {
      return;
    }

    const minReceived = executionTrade.minimumAmountOut(new Percent(slippageTolerance, 10_000));
    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Router.address}`;
    const rlpEncodedData = getRlpEncodedSwapData(executionTrade, '_swap', receiver, minReceived);
    const data = new Uint8Array(rlpEncodedData);

    if (isSpokeToken(inputAmount.currency)) {
      return await this._crossTransfer({ account, inputAmount, destination, data, fee: 0n });
    } else {
      return await this._deposit({ account, inputAmount, destination, data, fee: 0n });
    }
  }

  async executeDepositCollateral(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    const { inputAmount, account } = xTransactionInput;
    if (!inputAmount) {
      throw new Error('Invalid input amount');
    }

    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify({}));

    return await this._deposit({ account, inputAmount, destination, data, fee: 0n });
  }

  async executeWithdrawCollateral(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    const { inputAmount, account, direction, usedCollateral } = xTransactionInput;
    if (!inputAmount || !usedCollateral) {
      return;
    }

    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`;
    const amount = toICONDecimals(inputAmount.multiply(-1));
    const data = RLP.encode(['xWithdraw', uintToBytes(amount), usedCollateral]);
    return await this._sendCall({ account, sourceChainId: direction.from, destination, data, fee: 0n });
  }

  async executeBorrow(xTransactionInput: XTransactionInput): Promise<string | undefined> {
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
    return await this._sendCall({ account, sourceChainId: direction.from, destination, data, fee: 0n });
  }

  async executeRepay(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    const { inputAmount, account, usedCollateral, recipient } = xTransactionInput;
    if (!inputAmount || !usedCollateral) {
      return;
    }
    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`;
    const dataObj = recipient ? { _collateral: usedCollateral, _to: recipient } : { _collateral: usedCollateral };
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(dataObj));
    return await this._crossTransfer({ account, inputAmount: inputAmount.multiply(-1), destination, data, fee: 0n });
  }
}
