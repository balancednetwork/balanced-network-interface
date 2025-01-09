import { XTransactionInput, XTransactionType } from '@/xcall/types';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { XChainId, XToken } from '../types';
export abstract class XWalletClient {
  public xChainId: XChainId;

  constructor(xChainId: XChainId) {
    this.xChainId = xChainId;
  }

  abstract approve(
    amountToApprove: CurrencyAmount<XToken>,
    spender: string,
    owner: string,
  ): Promise<string | undefined>;

  async executeTransaction(xTransactionInput: XTransactionInput, options?: any): Promise<string | undefined> {
    const { type } = xTransactionInput;
    switch (type) {
      case XTransactionType.SWAP:
      case XTransactionType.BRIDGE:
      case XTransactionType.SWAP_ON_ICON: // only for icon
        return await this.executeSwapOrBridge(xTransactionInput);
      case XTransactionType.DEPOSIT:
        return await this.executeDepositCollateral(xTransactionInput);
      case XTransactionType.WITHDRAW:
        return await this.executeWithdrawCollateral(xTransactionInput);
      case XTransactionType.BORROW:
        return await this.executeBorrow(xTransactionInput);
      case XTransactionType.REPAY:
        return await this.executeRepay(xTransactionInput);

      case XTransactionType.LP_DEPOSIT_XTOKEN:
        return await this.depositXToken(xTransactionInput);
      case XTransactionType.LP_WITHDRAW_XTOKEN:
        return await this.withdrawXToken(xTransactionInput);
      case XTransactionType.LP_ADD_LIQUIDITY:
        return await this.addLiquidity(xTransactionInput);
      case XTransactionType.LP_REMOVE_LIQUIDITY:
        return await this.removeLiquidity(xTransactionInput);
      case XTransactionType.LP_STAKE:
        return await this.stake(xTransactionInput);
      case XTransactionType.LP_UNSTAKE:
        return await this.unstake(xTransactionInput);
      case XTransactionType.LP_CLAIM_REWARDS:
        return await this.claimRewards(xTransactionInput);

      default:
        throw new Error('Invalid XTransactionType');
    }
  }

  abstract executeSwapOrBridge(xTransactionInput: XTransactionInput): Promise<string | undefined>;
  abstract executeDepositCollateral(xTransactionInput: XTransactionInput): Promise<string | undefined>;
  abstract executeWithdrawCollateral(xTransactionInput: XTransactionInput): Promise<string | undefined>;
  abstract executeBorrow(xTransactionInput: XTransactionInput): Promise<string | undefined>;
  abstract executeRepay(xTransactionInput: XTransactionInput): Promise<string | undefined>;

  abstract depositXToken(xTransactionInput: XTransactionInput): Promise<string | undefined>;
  abstract withdrawXToken(xTransactionInput: XTransactionInput): Promise<string | undefined>;
  abstract addLiquidity(xTransactionInput: XTransactionInput): Promise<string | undefined>;
  abstract removeLiquidity(xTransactionInput: XTransactionInput): Promise<string | undefined>;
  abstract stake(xTransactionInput: XTransactionInput): Promise<string | undefined>;
  abstract unstake(xTransactionInput: XTransactionInput): Promise<string | undefined>;
  abstract claimRewards(xTransactionInput: XTransactionInput): Promise<string | undefined>;
}
