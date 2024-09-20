import { BigNumber, Converter } from 'icon-sdk-js';

import { XPublicClient } from '@/xwagmi/core/XPublicClient';
import { XChainId, XToken } from '@/xwagmi/types';
import { sleep } from '@/xwagmi/utils';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { TransactionStatus, XCallEvent } from '../../xcall/types';
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
    // TODO: hardcoded for now, confirm with the team
    return BigInt(110_000_000);
  }

  async getBlockHeight() {
    return BigInt(0); // not used
  }

  async getTxReceipt(txHash: string) {
    const res = await this.getPublicClient().getTransactionBlock({
      digest: txHash,
      options: {
        showRawInput: true,
        showEffects: true,
      },
    });
    return res;
  }

  deriveTxStatus(rawTx): TransactionStatus {
    if (rawTx) {
      if (rawTx.effects.status.status === 'success') {
        return TransactionStatus.success;
      } else {
        return TransactionStatus.failure;
      }
    }
    return TransactionStatus.pending;
  }

  getTxEventLogs(rawTx) {
    return []; // not used
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
