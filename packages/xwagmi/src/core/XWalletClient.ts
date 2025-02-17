import { CurrencyAmount, XChainId } from '@balancednetwork/sdk-core';
import { RLP } from '@ethereumjs/rlp';

import { ICON_XCALL_NETWORK_ID } from '@/constants';
import { convertCurrency, convertCurrencyAmount, isSpokeToken, uintToBytes } from '@/utils';
import { getRlpEncodedSwapData, toICONDecimals } from '@/xcall';
import { XTransactionInput, XTransactionType } from '@/xcall/types';
import { bnJs } from '@/xchains/icon/bnJs';
import { XToken } from '../types';
import {
  getAddLPData,
  getClaimRewardData,
  getLockData,
  getStakeData,
  getUnStakeData,
  getWithdrawData,
  getXRemoveData,
  tokenData,
} from './utils';

export interface DepositParams {
  account: string;
  inputAmount: CurrencyAmount<XToken>;
  destination: string;
  data: Buffer;
  fee: bigint;
}
export interface SendCallParams {
  account: string;
  sourceChainId: XChainId;
  destination: string;
  data: Buffer;
  fee: bigint;
}
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

  abstract _deposit({ account, inputAmount, destination, data, fee }: DepositParams): Promise<string | undefined>;
  abstract _crossTransfer({ account, inputAmount, destination, data, fee }: DepositParams): Promise<string | undefined>;
  abstract _sendCall({ account, sourceChainId, destination, data, fee }: SendCallParams): Promise<string | undefined>;

  async executeTransaction(xTransactionInput: XTransactionInput): Promise<string | undefined> {
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

      case XTransactionType.LOCK_BNUSD:
        return await this.lockBnUSD(xTransactionInput);
      case XTransactionType.UNLOCK_BNUSD:
        return await this.unlockBnUSD(xTransactionInput);

      default:
        throw new Error('Invalid XTransactionType');
    }
  }

  async executeSwapOrBridge(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    const { type, direction, inputAmount, recipient, account, xCallFee, minReceived, path } = xTransactionInput;

    const receiver = `${direction.to}/${recipient}`;
    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Router.address}`;

    let data: Buffer;
    if (type === XTransactionType.SWAP) {
      if (!minReceived || !path) {
        throw new Error('minReceived and path are required');
      }
      data = getRlpEncodedSwapData(path, '_swap', receiver, minReceived);
    } else if (type === XTransactionType.BRIDGE) {
      data = Buffer.from(
        JSON.stringify({
          method: '_swap',
          params: {
            path: [],
            receiver: receiver,
          },
        }),
      );
    } else {
      throw new Error('Invalid XTransactionType');
    }

    if (isSpokeToken(inputAmount.currency)) {
      return await this._crossTransfer({ account, inputAmount, destination, data, fee: xCallFee.rollback });
    } else {
      return await this._deposit({ account, inputAmount, destination, data, fee: xCallFee.rollback });
    }
  }

  async executeDepositCollateral(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    const { inputAmount, account, xCallFee } = xTransactionInput;

    if (!inputAmount) {
      throw new Error('inputAmount is required');
    }

    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`;
    const data = Buffer.from(JSON.stringify({}));

    return await this._deposit({ inputAmount, account, destination, data, fee: xCallFee.rollback });
  }

  async executeWithdrawCollateral(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    const { inputAmount, account, xCallFee, usedCollateral, direction } = xTransactionInput;

    if (!inputAmount || !usedCollateral) {
      throw new Error('inputAmount and usedCollateral are required');
    }

    const amount = toICONDecimals(inputAmount.multiply(-1));
    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`;
    const data = Buffer.from(RLP.encode(['xWithdraw', uintToBytes(amount), usedCollateral]));

    return await this._sendCall({ account, sourceChainId: direction.from, destination, data, fee: xCallFee.rollback });
  }

  async executeBorrow(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    const { inputAmount, account, xCallFee, usedCollateral, recipient, direction } = xTransactionInput;

    if (!inputAmount || !usedCollateral) {
      throw new Error('inputAmount and usedCollateral are required');
    }

    const amount = BigInt(inputAmount.quotient.toString());
    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`;
    const data = Buffer.from(
      RLP.encode(
        recipient
          ? ['xBorrow', usedCollateral, uintToBytes(amount), Buffer.from(recipient)]
          : ['xBorrow', usedCollateral, uintToBytes(amount)],
      ),
    );

    return await this._sendCall({ account, sourceChainId: direction.from, destination, data, fee: xCallFee.rollback });
  }

  async executeRepay(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    const { inputAmount, account, xCallFee, usedCollateral, recipient, direction } = xTransactionInput;

    if (!inputAmount || !usedCollateral) {
      throw new Error('inputAmount and usedCollateral are required');
    }

    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`;
    const data = Buffer.from(
      JSON.stringify(recipient ? { _collateral: usedCollateral, _to: recipient } : { _collateral: usedCollateral }),
    );

    const _inputAmount = inputAmount.multiply(-1);
    return await this._crossTransfer({ account, inputAmount: _inputAmount, destination, data, fee: xCallFee.rollback });
  }

  // liquidity related
  async depositXToken(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    const { account, inputAmount, xCallFee } = xTransactionInput;

    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Dex.address}`;
    const data = Buffer.from(tokenData('_deposit', { address: `${inputAmount.currency.xChainId}/${account}` }));

    let hash;
    if (isSpokeToken(inputAmount.currency)) {
      hash = await this._crossTransfer({ account, inputAmount, destination, data, fee: xCallFee.rollback });
    } else {
      hash = await this._deposit({ account, inputAmount, destination, data, fee: xCallFee.rollback });
    }

    return hash;
  }

  async withdrawXToken(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    const { account, inputAmount, xCallFee, direction } = xTransactionInput;
    const _inputAmount = convertCurrencyAmount(ICON_XCALL_NETWORK_ID, inputAmount)!;
    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Dex.address}`;
    const amount = BigInt(_inputAmount.quotient.toString());
    const data = Buffer.from(getWithdrawData(_inputAmount.currency.address, amount));

    return await this._sendCall({ account, sourceChainId: direction.from, destination, data, fee: xCallFee.rollback });
  }

  async addLiquidity(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    const { account, inputAmount, outputAmount, xCallFee, direction } = xTransactionInput;

    if (!outputAmount) {
      throw new Error('outputAmount is required');
    }

    const _inputAmount = convertCurrencyAmount(ICON_XCALL_NETWORK_ID, inputAmount)!;
    const _outputAmount = convertCurrencyAmount(ICON_XCALL_NETWORK_ID, outputAmount)!;

    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Dex.address}`;
    const amountA = BigInt(_inputAmount.quotient.toString());
    const amountB = BigInt(_outputAmount.quotient.toString());

    const data = Buffer.from(
      getAddLPData(_inputAmount.currency.address, _outputAmount.currency.address, amountA, amountB, true, 1_000n),
    );

    return await this._sendCall({ account, sourceChainId: direction.from, destination, data, fee: xCallFee.rollback });
  }

  async removeLiquidity(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    const { account, inputAmount, poolId, xCallFee, direction } = xTransactionInput;

    if (!poolId) {
      throw new Error('poolId is required');
    }

    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Dex.address}`;
    const amount = BigInt(inputAmount.quotient.toString());
    const data = Buffer.from(getXRemoveData(poolId, amount, true));

    return await this._sendCall({ account, sourceChainId: direction.from, destination, data, fee: xCallFee.rollback });
  }

  async stake(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    const { account, inputAmount, poolId, xCallFee, direction } = xTransactionInput;

    if (!poolId) {
      throw new Error('poolId is required');
    }

    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Dex.address}`;
    const amount = BigInt(inputAmount.quotient.toString());
    const data = Buffer.from(getStakeData(`${ICON_XCALL_NETWORK_ID}/${bnJs.StakedLP.address}`, poolId, amount));

    return await this._sendCall({ account, sourceChainId: direction.from, destination, data, fee: xCallFee.rollback });
  }

  async unstake(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    const { account, inputAmount, poolId, xCallFee, direction } = xTransactionInput;

    if (!poolId) {
      throw new Error('poolId is required');
    }

    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.StakedLP.address}`;
    const amount = BigInt(inputAmount.quotient.toString());
    const data = Buffer.from(getUnStakeData(poolId, amount));

    return await this._sendCall({ account, sourceChainId: direction.from, destination, data, fee: xCallFee.rollback });
  }

  async claimRewards(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    const { account, xCallFee, direction } = xTransactionInput;

    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Rewards.address}`;
    const data = Buffer.from(getClaimRewardData('', []));

    return await this._sendCall({ account, sourceChainId: direction.from, destination, data, fee: xCallFee.rollback });
  }

  // lock stable token
  async lockBnUSD(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    const { account, inputAmount, direction, xCallFee } = xTransactionInput;

    // Depositing bnUSD on spoke chain is the normal process of bnUSD crossTransfer from spoke chain. But the data field shouldn't be empty in this case. Data should contain a rlp encoded value as specified on below code for solana spoke chain:
    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Savings.address}`;

    const data = getLockData('_lock', {});
    const hash = await this._crossTransfer({ account, inputAmount, destination, data, fee: xCallFee.rollback });
    return hash;

    // Another way of bnUSD deposit from the spoke chain using other supported tokens is deposit token to Asset Manager contract of the spoke chain.
    // Doing that the to field should be the 'ICON Router Contract Address' and data should be prepared on the following way.

    // const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Router.address}`;

    // // const lockData = getLockData('_lock', { to: direction.from }); //direction.from is 0xa4b1.arbitrum
    // // const lockData = getLockData('_lock', { to: '0x1.icon' });
    // const lockData = getLockData('_lock', {});

    // console.log('lockData', lockData);
    // const receiver = Buffer.from(bnJs.Savings.address, 'utf8');
    // const data = Buffer.from(
    //   RLP.encode([
    //     '_swap',
    //     receiver,
    //     '0x00', // minimum amount to receive
    //     lockData,
    //     ['0x01', bnJs.bnUSD.address],
    //   ]),
    // );

    // console.log('data', data);

    // return await this._deposit({ account, inputAmount, destination, data, fee: 0n });
  }

  // unlock stable token

  async unlockBnUSD(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    throw new Error('Not implemented');
  }
}
