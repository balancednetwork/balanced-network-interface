import { XPublicClient } from '@/xwagmi/core';
import { XChainId, XToken } from '@/xwagmi/types';
import { TransactionStatus, XCallEvent } from '@/xwagmi/xcall/types';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import * as StellarSdk from '@stellar/stellar-sdk';
import { StellarXService } from './StellarXService';
import { getTokenBalance } from './utils';

export class StellarXPublicClient extends XPublicClient {
  getXService(): StellarXService {
    return StellarXService.getInstance();
  }

  getPublicClient() {
    // not used
  }

  async getBalance(address: string | undefined, xToken: XToken) {
    if (!address) return;

    const xService = this.getXService();
    const stellarAccount = await xService.server.loadAccount(address);

    if (xToken.symbol === 'XLM') {
      const xlmBalance = stellarAccount.balances.find(balance => balance.asset_type === 'native');
      if (xlmBalance) {
        return CurrencyAmount.fromRawAmount(xToken, BigInt(xlmBalance.balance.replace('.', '')));
      }
    } else {
      try {
        const txBuilder = new StellarSdk.TransactionBuilder(stellarAccount, {
          fee: StellarSdk.BASE_FEE,
          networkPassphrase: StellarSdk.Networks.PUBLIC,
        });

        const balance = await getTokenBalance(address, xToken.address, txBuilder, xService.sorobanServer);

        return CurrencyAmount.fromRawAmount(xToken, balance);
      } catch (e) {
        throw new Error(`Error while fetching token on Stellar: ${xToken.symbol}, Error: ${e}`);
      }
    }
  }

  async getXCallFee(xChainId: XChainId, nid: XChainId, rollback: boolean) {
    return BigInt(10_700_000);
  }

  async getBlockHeight() {
    return BigInt(0); // not used
  }

  async getTxReceipt(txHash) {
    // not used
  }

  getTxEventLogs(rawTx) {
    return []; // not used
  }

  deriveTxStatus(rawTx: any): TransactionStatus {
    if (rawTx) {
      if (rawTx.code) {
        return TransactionStatus.failure;
      }

      return TransactionStatus.success;
    }

    return TransactionStatus.failure;
  }

  getScanBlockCount() {
    return 10n;
  }

  async getEventLogs(
    xChainId: XChainId,
    { startBlockHeight, endBlockHeight }: { startBlockHeight: bigint; endBlockHeight: bigint },
  ) {
    return []; // not used
  }

  parseEventLogs(eventLogs: any[]): XCallEvent[] {
    return []; // not used
  }
}
