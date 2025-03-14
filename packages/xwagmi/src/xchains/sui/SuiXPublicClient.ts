import { CurrencyAmount, XChainId } from '@balancednetwork/sdk-core';

import { XPublicClient } from '@/core/XPublicClient';
import { XToken } from '@/types';
import { TransactionStatus, XCallEvent, XTransactionInput } from '../../xcall/types';
import { SuiXService } from './SuiXService';

export class SuiXPublicClient extends XPublicClient {
  getXService(): SuiXService {
    return SuiXService.getInstance();
  }

  getPublicClient(): any {
    return this.getXService().suiClient;
  }

  // getBalance is not used because getBalances uses getAllBalances which returns all balances
  async getBalance(address: string | undefined, xToken: XToken) {
    if (!address) return;

    if (xToken.isNativeToken) {
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

  async getBalances(address: string | undefined, xTokens: XToken[]) {
    if (!address) return {};

    try {
      const allBalances = await this.getPublicClient().getAllBalances({
        owner: address,
      });
      const tokenMap = xTokens.reduce((map, xToken) => {
        const coinType = xToken.isNativeToken ? '0x2::sui::SUI' : xToken.address;
        const balance = allBalances.find(b => b.coinType === coinType);

        if (balance) map[xToken.address] = CurrencyAmount.fromRawAmount(xToken, balance.totalBalance);
        return map;
      }, {});

      return tokenMap;
    } catch (e) {
      console.log('error', e);
      return {};
    }
  }

  async getXCallFee(xChainId: XChainId, nid: XChainId, rollback: boolean, sources?: string[]) {
    // TODO: hardcoded for now, confirm with the team
    return BigInt(50_000_000);
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

  needsApprovalCheck(xToken: XToken): boolean {
    return false;
  }

  async estimateApproveGas(amountToApprove: CurrencyAmount<XToken>, spender: string, owner: string) {
    return 0n;
  }

  async estimateSwapGas(xTransactionInput: XTransactionInput) {
    // TODO: implement
    return 0n;
  }
}
