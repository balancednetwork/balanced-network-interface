import { XTransactionInput } from '@/xcall/types';
import { XWalletClient } from './XWalletClient';

export class XLiquidityService {
  constructor(private client: XWalletClient) {}

  depositXToken(xTransactionInput: XTransactionInput) {}
  async withdrawXToken(xTransactionInput: XTransactionInput) {}
  async addLiquidity(xTransactionInput: XTransactionInput) {}
  async removeLiquidity(xTransactionInput: XTransactionInput) {}
  async stake(xTransactionInput: XTransactionInput) {}
  async unstake(xTransactionInput: XTransactionInput) {}
  async claimRewards(xTransactionInput: XTransactionInput) {}
}
