import { BigNumber, Converter } from 'icon-sdk-js';

import { XPublicClient } from '@/xwagmi/core/XPublicClient';
import { XChainId, XToken } from '@/xwagmi/types';
import { sleep } from '@/xwagmi/utils';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { TransactionStatus, XCallEvent, XCallEventType } from '../../xcall/types';
import { havahJs } from '../havah';
import { ICONTxResultType } from '../icon/types';
import { SuiXService } from './SuiXService';

export class SuiXPublicClient extends XPublicClient {
  getXService(): SuiXService {
    return SuiXService.getInstance();
  }

  getPublicClient(): any {
    return this.getXService().suiClient;
  }

  async getBalance(address: string | undefined, xToken: XToken) {
    if (!address) return;

    if (xToken.isNativeXToken()) {
      const balance = await this.getPublicClient().getBalance({
        owner: address,
        coinType: '0x2::sui::SUI',
      });
      return CurrencyAmount.fromRawAmount(xToken, balance.totalBalance);
    } else {
      const balance = await this.getPublicClient().getBalance({
        owner: address,
        coinType: xToken.address,
      });
      return CurrencyAmount.fromRawAmount(xToken, balance.totalBalance);
    }
  }

  // TODO: implement this using suiClient.getAllBalances
  // async getBalances(address: string | undefined, xTokens: XToken[]) {
  // }

  async getXCallFee(xChainId: XChainId, nid: XChainId, rollback: boolean, sources?: string[]) {
    const res = await havahJs.XCall.getFee(nid, rollback, sources);
    return BigInt(res);
  }

  async getBlockHeight() {
    return BigInt(0); // not used
  }

  // TODO: implement
  async getTxReceipt(txHash: string) {
    for (let i = 0; i < 10; i++) {
      try {
        const txResult = await this.getPublicClient().getTransactionResult(txHash).execute();
        return txResult as ICONTxResultType;
      } catch (e) {
        console.log(`xCall debug - icon tx result (pass ${i}):`, e);
      }
      await sleep(1000);
    }
  }

  // TODO: implement
  getTxEventLogs(rawTx) {
    return rawTx?.eventLogs;
  }

  // TODO: implement
  deriveTxStatus(rawTx): TransactionStatus {
    if (rawTx) {
      const status = Converter.toNumber(rawTx.status);
      if (status === 1) {
        return TransactionStatus.success;
      } else {
        return TransactionStatus.failure;
      }
    }
    return TransactionStatus.pending;
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
