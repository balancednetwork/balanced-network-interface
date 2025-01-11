import { FROM_SOURCES, TO_SOURCES, stellar } from '@/constants/xChains';
import { XWalletClient } from '@/core';
import { DepositParams, SendCallParams } from '@/core/XWalletClient';
import { BASE_FEE, Networks, TransactionBuilder, nativeToScVal } from '@stellar/stellar-sdk';
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

    const encoder = new TextEncoder();

    const params = [
      accountToScVal(account),
      nativeToScVal(XLM_CONTRACT_ADDRESS, { type: 'address' }),
      nativeToScVal(inputAmount.quotient, { type: 'u128' }),
      nativeToScVal(destination),
      nativeToScVal(encoder.encode(data), { type: 'bytes' }),
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

    const encoder = new TextEncoder();

    const params = [
      accountToScVal(account),
      nativeToScVal(inputAmount.quotient, { type: 'u128' }),
      nativeToScVal(destination),
      nativeToScVal(encoder.encode(data), { type: 'bytes' }),
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
}
