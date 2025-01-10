import { CurrencyAmount, MaxUint256, Percent, XChainId } from '@balancednetwork/sdk-core';
import { RLP } from '@ethereumjs/rlp';
import { Address, PublicClient, WalletClient, erc20Abi, getContract, toHex } from 'viem';
import bnJs from '../icon/bnJs';

import { ICON_XCALL_NETWORK_ID, xTokenMapBySymbol } from '@/constants';
import { FROM_SOURCES, TO_SOURCES, xChainMap } from '@/constants/xChains';
import { XWalletClient } from '@/core/XWalletClient';
import { XToken } from '@/types';
import { uintToBytes } from '@/utils';
import { XTransactionInput, XTransactionType } from '../../xcall/types';
import { getRlpEncodedSwapData, toICONDecimals } from '../../xcall/utils';
import { isSpokeToken } from '../archway/utils';
import { EvmXService } from './EvmXService';
import { assetManagerContractAbi } from './abis/assetManagerContractAbi';
import { bnUSDContractAbi } from './abis/bnUSDContractAbi';
import { xCallContractAbi } from './abis/xCallContractAbi';
import { getAddLPData, getStakeData, getUnStakeData, getWithdrawData, getXRemoveData, tokenData } from './utils';

export class EvmXWalletClient extends XWalletClient {
  getXService(): EvmXService {
    return EvmXService.getInstance();
  }

  getChainId() {
    const xChain = xChainMap[this.xChainId];
    return xChain.id;
  }

  getPublicClient(): PublicClient {
    const publicClient = this.getXService().getPublicClient(this.getChainId());
    if (!publicClient) {
      throw new Error('EvmXPublicClient: publicClient is not initialized yet');
    }
    return publicClient as PublicClient;
  }

  async getWalletClient(): Promise<WalletClient> {
    const walletClient = await this.getXService().getWalletClient(this.getChainId());
    if (!walletClient) {
      throw new Error('EvmXWalletClient: walletClient is not initialized yet');
    }
    return walletClient;
  }

  async approve(amountToApprove: CurrencyAmount<XToken>, spender: string, owner: string) {
    const xToken = amountToApprove.currency;

    const publicClient = this.getPublicClient();
    const walletClient = await this.getWalletClient();

    const tokenContract = getContract({
      abi: erc20Abi,
      address: xToken.address as Address,
      client: { public: publicClient, wallet: walletClient },
    });
    const account = owner as Address;
    const { request } = await tokenContract.simulate.approve(
      [spender as `0x${string}`, amountToApprove?.quotient ? BigInt(amountToApprove.quotient.toString()) : MaxUint256],
      { account },
    );

    const hash = await walletClient.writeContract({ ...request, account });
    return hash;
  }

  private async _deposit({
    account,
    inputAmount,
    destination,
    data,
    fee,
  }: {
    account: string;
    inputAmount: CurrencyAmount<XToken>;
    destination: string;
    data: any;
    fee: bigint;
  }) {
    const walletClient = await this.getWalletClient();

    const amount = BigInt(inputAmount.quotient.toString());

    if (!inputAmount.currency.isNativeToken) {
      const res = await this.getPublicClient().simulateContract({
        account: account as Address,
        address: xChainMap[inputAmount.currency.xChainId].contracts.assetManager as Address,
        abi: assetManagerContractAbi,
        functionName: 'deposit',
        args: [inputAmount.currency.address as Address, amount, destination, data],
        value: fee,
      });
      const hash = await walletClient.writeContract(res.request);
      return hash;
    } else {
      const res = await this.getPublicClient().simulateContract({
        account: account as Address,
        address: xChainMap[inputAmount.currency.xChainId].contracts.assetManager as Address,
        abi: assetManagerContractAbi,
        functionName: 'depositNative',
        args: [amount, destination, data],
        value: fee + amount,
      });
      const hash = await walletClient.writeContract(res.request);
      return hash;
    }
  }

  private async _crossTransfer({
    account,
    inputAmount,
    destination,
    data,
    fee,
  }: {
    account: string;
    inputAmount: CurrencyAmount<XToken>;
    destination: string;
    data: any;
    fee: bigint;
  }) {
    const walletClient = await this.getWalletClient();

    const amount = BigInt(inputAmount.quotient.toString());

    const res = await this.getPublicClient().simulateContract({
      account: account as Address,
      address: inputAmount.currency.address as Address,
      abi: bnUSDContractAbi,
      functionName: 'crossTransfer',
      args: [destination, amount, data],
      value: fee,
    });
    const hash = await walletClient.writeContract(res.request);
    return hash;
  }

  private async _sendCall({
    account,
    sourceChainId,
    destination,
    data,
    fee,
  }: {
    account: string;
    sourceChainId: XChainId;
    destination: string;
    data: any;
    fee: bigint;
  }) {
    const envelope = toHex(
      RLP.encode([
        Buffer.from([0]),
        data,
        FROM_SOURCES[sourceChainId]?.map(Buffer.from),
        TO_SOURCES[sourceChainId]?.map(Buffer.from),
      ]),
    );

    const res = await this.getPublicClient().simulateContract({
      account: account as Address,
      address: xChainMap[sourceChainId].contracts.xCall as Address,
      abi: xCallContractAbi,
      functionName: 'sendCall',
      args: [destination, envelope],
      value: fee,
    });

    const walletClient = await this.getWalletClient();
    const hash = await walletClient.writeContract(res.request);
    return hash;
  }

  async executeSwapOrBridge(xTransactionInput: XTransactionInput) {
    const { type, direction, inputAmount, recipient, account, xCallFee, executionTrade, slippageTolerance } =
      xTransactionInput;

    const receiver = `${direction.to}/${recipient}`;
    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Router.address}`;

    let data: Address;
    switch (type) {
      case XTransactionType.SWAP: {
        if (!executionTrade || !slippageTolerance) {
          return;
        }
        const minReceived = executionTrade.minimumAmountOut(new Percent(slippageTolerance, 10_000));
        const rlpEncodedData = getRlpEncodedSwapData(executionTrade, '_swap', receiver, minReceived).toString('hex');
        data = `0x${rlpEncodedData}`;
        break;
      }
      case XTransactionType.BRIDGE:
        data = toHex(
          JSON.stringify({
            method: '_swap',
            params: {
              path: [],
              receiver: receiver,
            },
          }),
        );
        break;
      default:
        throw new Error('Invalid XTransactionType');
    }

    if (isSpokeToken(inputAmount.currency)) {
      return await this._crossTransfer({
        account,
        inputAmount,
        destination,
        data,
        fee: xCallFee.rollback,
      });
    } else {
      return await this._deposit({
        account,
        inputAmount,
        destination,
        data,
        fee: xCallFee.rollback,
      });
    }
  }

  async executeDepositCollateral(xTransactionInput: XTransactionInput) {
    const { inputAmount, account, xCallFee, direction } = xTransactionInput;

    if (!inputAmount) {
      return;
    }

    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`;
    const data = toHex(JSON.stringify({}));

    return await this._deposit({
      inputAmount,
      account,
      destination,
      data,
      fee: xCallFee.rollback,
    });
  }

  async executeWithdrawCollateral(xTransactionInput: XTransactionInput) {
    const { inputAmount, account, xCallFee, usedCollateral, direction } = xTransactionInput;

    if (!inputAmount || !usedCollateral) {
      return;
    }

    const amount = toICONDecimals(inputAmount.multiply(-1));
    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`;
    const data = toHex(RLP.encode(['xWithdraw', uintToBytes(amount), usedCollateral]));

    return await this._sendCall({
      account,
      sourceChainId: direction.from,
      destination,
      data,
      fee: xCallFee.rollback,
    });
  }

  async executeBorrow(xTransactionInput: XTransactionInput) {
    const { inputAmount, account, xCallFee, usedCollateral, recipient, direction } = xTransactionInput;

    if (!inputAmount || !usedCollateral) {
      return;
    }

    const amount = BigInt(inputAmount.quotient.toString());
    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`;
    const data = toHex(
      RLP.encode(
        recipient
          ? ['xBorrow', usedCollateral, uintToBytes(amount), Buffer.from(recipient)]
          : ['xBorrow', usedCollateral, uintToBytes(amount)],
      ),
    );

    return await this._sendCall({
      account,
      sourceChainId: direction.from,
      destination,
      data,
      fee: xCallFee.rollback,
    });
  }

  async executeRepay(xTransactionInput: XTransactionInput) {
    const { inputAmount, account, xCallFee, usedCollateral, recipient, direction } = xTransactionInput;

    if (!inputAmount || !usedCollateral) {
      return;
    }

    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`;
    const data = toHex(
      JSON.stringify(recipient ? { _collateral: usedCollateral, _to: recipient } : { _collateral: usedCollateral }),
    );

    return await this._crossTransfer({
      account,
      inputAmount: inputAmount.multiply(-1),
      destination,
      data,
      fee: xCallFee.rollback,
    });
  }

  // liquidity related
  async depositXToken(xTransactionInput: XTransactionInput) {
    const { account, inputAmount, xCallFee } = xTransactionInput;

    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Dex.address}`;
    const data = toHex(tokenData('_deposit', {}));

    let hash;
    if (isSpokeToken(inputAmount.currency)) {
      hash = await this._crossTransfer({
        account,
        inputAmount,
        destination,
        data,
        fee: xCallFee.rollback,
      });
    } else {
      hash = await this._deposit({
        account,
        inputAmount,
        destination,
        data,
        fee: xCallFee.rollback,
      });
    }

    return hash;
  }

  async withdrawXToken(xTransactionInput: XTransactionInput) {
    const { account, inputAmount, xCallFee } = xTransactionInput;

    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Dex.address}`;
    const amount = BigInt(inputAmount.quotient.toString());
    const xTokenOnIcon = xTokenMapBySymbol[ICON_XCALL_NETWORK_ID][inputAmount.currency.symbol];
    const data = toHex(getWithdrawData(xTokenOnIcon.address, amount));

    return await this._sendCall({
      account,
      sourceChainId: inputAmount.currency.xChainId,
      destination,
      data,
      fee: xCallFee.rollback,
    });
  }

  async addLiquidity(xTransactionInput: XTransactionInput) {
    const { account, inputAmount, outputAmount, xCallFee } = xTransactionInput;

    if (!outputAmount) {
      throw new Error('outputAmount is required');
    }

    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Dex.address}`;
    const amountA = BigInt(inputAmount.quotient.toString());
    const amountB = BigInt(outputAmount.quotient.toString());
    const xTokenAOnIcon = xTokenMapBySymbol[ICON_XCALL_NETWORK_ID][inputAmount.currency.symbol];
    const xTokenBOnIcon = xTokenMapBySymbol[ICON_XCALL_NETWORK_ID][outputAmount.currency.symbol];
    const data = toHex(getAddLPData(xTokenAOnIcon.address, xTokenBOnIcon.address, amountA, amountB, true, 1_000n));

    return await this._sendCall({
      account,
      sourceChainId: inputAmount.currency.xChainId,
      destination,
      data,
      fee: xCallFee.rollback,
    });
  }

  async removeLiquidity(xTransactionInput: XTransactionInput) {
    const { account, inputAmount, poolId, xCallFee } = xTransactionInput;

    if (!poolId) {
      throw new Error('poolId is required');
    }

    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Dex.address}`;
    const amount = BigInt(inputAmount.quotient.toString());
    const data = toHex(getXRemoveData(poolId, amount, true));

    return await this._sendCall({
      account,
      sourceChainId: inputAmount.currency.xChainId,
      destination,
      data,
      fee: xCallFee.rollback,
    });
  }

  async stake(xTransactionInput: XTransactionInput) {
    const { account, inputAmount, poolId, xCallFee } = xTransactionInput;

    if (!poolId) {
      throw new Error('poolId is required');
    }

    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Dex.address}`;
    const amount = BigInt(inputAmount.quotient.toString());

    const data = toHex(getStakeData(`${ICON_XCALL_NETWORK_ID}/${bnJs.StakedLP.address}`, poolId, amount));

    return await this._sendCall({
      account,
      sourceChainId: inputAmount.currency.xChainId,
      destination,
      data,
      fee: xCallFee.rollback,
    });
  }

  async unstake(xTransactionInput: XTransactionInput) {
    const { account, inputAmount, poolId, xCallFee, direction } = xTransactionInput;

    if (!poolId) {
      throw new Error('poolId is required');
    }

    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.StakedLP.address}`;
    const amount = BigInt(inputAmount.quotient.toString());
    const data = toHex(getUnStakeData(poolId, amount));

    return await this._sendCall({
      account,
      sourceChainId: inputAmount.currency.xChainId,
      destination,
      data,
      fee: xCallFee.rollback,
    });
  }

  async claimRewards(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }
}
