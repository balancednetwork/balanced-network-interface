import { FROM_SOURCES, TO_SOURCES, stellar } from '@/constants/xChains';
import { XWalletClient } from '@/core';
import { DepositParams, SendCallParams } from '@/core/XWalletClient';
import { BASE_FEE, Networks, TransactionBuilder, nativeToScVal } from '@stellar/stellar-sdk';
import { StellarXService } from './StellarXService';
import {
  STELLAR_RLP_DATA_TYPE,
  STELLAR_RLP_ENVELOPE_TYPE,
  STELLAR_RLP_MSG_TYPE,
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
    const xService = this.getXService();

    const params = [
      accountToScVal(account),
      nativeToScVal(inputAmount.currency.address, { type: 'address' }),
      nativeToScVal(inputAmount.quotient, { type: 'u128' }),
      nativeToScVal(destination),
      nativeToScVal(data, { type: 'bytes' }),
    ];

    const hash = await sendTX(xService, account, stellar.contracts.assetManager, 'deposit', params);
    return hash;
  }

  async _crossTransfer({ account, inputAmount, destination, data, fee }: DepositParams) {
    const xService = this.getXService();

    const params = [
      accountToScVal(account),
      nativeToScVal(inputAmount.quotient, { type: 'u128' }),
      nativeToScVal(destination),
      nativeToScVal(data, { type: 'bytes' }),
    ];

    const hash = await sendTX(xService, account, inputAmount.currency.wrapped.address, 'cross_transfer', params);
    return hash;
  }

  async _sendCall({ account, sourceChainId, destination, data, fee }: SendCallParams) {
    const xService = this.getXService();

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

    const hash = await sendTX(xService, account, stellar.contracts.xCall, 'send_call', params);
    return hash;
  }
}
