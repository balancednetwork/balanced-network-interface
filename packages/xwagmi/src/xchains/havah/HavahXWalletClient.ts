import { FROM_SOURCES, TO_SOURCES } from '@/constants';
import { DepositParams, SendCallParams, XWalletClient } from '@/core/XWalletClient';
import { toDec } from '@/utils';
import { RLP } from '@ethereumjs/rlp';
import { toHex } from 'viem';
import { XTransactionInput } from '../../xcall/types';
import { HavahXService } from './HavahXService';

export class HavahXWalletClient extends XWalletClient {
  getXService(): HavahXService {
    return HavahXService.getInstance();
  }

  async approve(amountToApprove, spender, owner) {
    return Promise.resolve(undefined);
  }

  async _deposit({ account, inputAmount, destination, data, fee }: DepositParams) {
    const isNative = inputAmount.currency.isNativeToken;
    if (!isNative) {
      throw new Error('Only native token and bnUSD are supported');
    }
    const txResult = await this.getXService()
      .walletClient.inject({ account })
      .AssetManager['deposit'](parseFloat(inputAmount.toExact()), destination, toHex(data), fee.toString());
    const { txHash: hash } = txResult || {};
    return hash;
  }

  async _crossTransfer({ account, inputAmount, destination, data, fee }: DepositParams) {
    const txResult = await this.getXService()
      .walletClient.inject({ account })
      .bnUSD['crossTransferV2'](destination, toDec(inputAmount), toHex(data), fee);
    const { txHash: hash } = txResult || {};
    return hash;
  }

  async _sendCall({ account, sourceChainId, destination, data, fee }: SendCallParams): Promise<string | undefined> {
    const envelope = toHex(
      RLP.encode([
        Buffer.from([0]),
        toHex(data),
        FROM_SOURCES[sourceChainId]?.map(Buffer.from),
        TO_SOURCES[sourceChainId]?.map(Buffer.from),
      ]),
    );

    const txResult = await this.getXService().walletClient.inject({ account }).XCall['sendCall'](destination, envelope);
    const { txHash: hash } = txResult || {};
    return hash;
  }

  async executeDepositCollateral(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    throw new Error('Not supported.');
  }

  async executeWithdrawCollateral(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    throw new Error('Not supported.');
  }

  async executeBorrow(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    throw new Error('Not supported.');
  }
}
