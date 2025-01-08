import {
  FROM_SOURCES,
  ICON_XCALL_NETWORK_ID,
  TO_SOURCES,
  bnJs,
  bnUSDContractAbi,
  isSpokeToken,
  uintToBytes,
  xCallContractAbi,
  xChainMap,
  xTokenMapBySymbol,
} from '@/index';
import { XTransactionInput } from '@/xcall/types';
import { RLP } from '@ethereumjs/rlp';
import { Address, toHex } from 'viem';
import { EvmXWalletClient } from './EvmXWalletClient';
import { getStakeData, getUnStakeData, getXRemoveData } from './utils';

export class EvmXLiquidityService {
  constructor(private client: EvmXWalletClient) {}

  async depositXToken(xTransactionInput: XTransactionInput) {
    const { account, inputAmount, xCallFee } = xTransactionInput;

    const publicClient = this.client.getPublicClient();
    const walletClient = await this.client.getWalletClient();

    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Dex.address}`;
    const amount = BigInt(inputAmount.quotient.toString());
    const data = toHex(
      JSON.stringify({
        method: '_deposit',
        params: {},
      }),
    );

    const _isSpokeToken = isSpokeToken(inputAmount.currency);
    const isNative = inputAmount.currency.isNativeToken;

    let hash;
    if (_isSpokeToken) {
      const res = await publicClient.simulateContract({
        account: account as Address,
        address: xTokenMapBySymbol[this.client.xChainId][inputAmount.currency.symbol].address as Address,
        abi: bnUSDContractAbi,
        functionName: 'crossTransfer',
        args: [destination, amount, data],
        value: xCallFee.rollback,
      });
      hash = await walletClient.writeContract(res.request);
    } else {
      if (!isNative) {
        throw new Error('not implemented');
      } else {
        throw new Error('not implemented');
      }
    }

    return hash;
  }

  async withdrawXToken(xTransactionInput: XTransactionInput) {
    const { account, inputAmount, xCallFee } = xTransactionInput;

    const publicClient = this.client.getPublicClient();
    const walletClient = await this.client.getWalletClient();

    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Dex.address}`;
    const amount = BigInt(inputAmount.quotient.toString());
    const xTokenOnIcon = xTokenMapBySymbol[ICON_XCALL_NETWORK_ID][inputAmount.currency.symbol];
    const data = toHex(
      RLP.encode([
        'xWithdraw',
        xTokenOnIcon.address, //
        uintToBytes(amount),
      ]),
    );

    const envelope = toHex(
      RLP.encode([
        Buffer.from([0]),
        data,
        FROM_SOURCES[this.client.xChainId]?.map(Buffer.from),
        TO_SOURCES[this.client.xChainId]?.map(Buffer.from),
      ]),
    );

    const _isSpokeToken = isSpokeToken(inputAmount.currency);
    const isNative = inputAmount.currency.isNativeToken;

    let hash;
    if (_isSpokeToken) {
      const res = await publicClient.simulateContract({
        account: account as Address,
        address: xChainMap[this.client.xChainId].contracts.xCall as Address,
        abi: xCallContractAbi,
        functionName: 'sendCall',
        args: [destination, envelope],
        value: xCallFee.rollback,
      });
      hash = await walletClient.writeContract(res.request);
    } else {
      if (!isNative) {
        throw new Error('not implemented');
      } else {
        throw new Error('not implemented');
      }
    }

    return hash;
  }

  async addLiquidity(xTransactionInput: XTransactionInput) {
    const { account, inputAmount, outputAmount, xCallFee } = xTransactionInput;

    if (!outputAmount) {
      throw new Error('outputAmount is required');
    }

    const publicClient = this.client.getPublicClient();
    const walletClient = await this.client.getWalletClient();

    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Dex.address}`;
    const amountA = BigInt(inputAmount.quotient.toString());
    const amountB = BigInt(outputAmount.quotient.toString());
    const xTokenAOnIcon = xTokenMapBySymbol[ICON_XCALL_NETWORK_ID][inputAmount.currency.symbol];
    const xTokenBOnIcon = xTokenMapBySymbol[ICON_XCALL_NETWORK_ID][outputAmount.currency.symbol];
    const data = toHex(
      RLP.encode([
        'xAdd',
        xTokenAOnIcon.address,
        xTokenBOnIcon.address,
        uintToBytes(amountA),
        uintToBytes(amountB),
        uintToBytes(1n),
        uintToBytes(1_000n),
      ]),
    );

    const envelope = toHex(
      RLP.encode([
        Buffer.from([0]),
        data,
        FROM_SOURCES[this.client.xChainId]?.map(Buffer.from),
        TO_SOURCES[this.client.xChainId]?.map(Buffer.from),
      ]),
    );

    const res = await publicClient.simulateContract({
      account: account as Address,
      address: xChainMap[this.client.xChainId].contracts.xCall as Address,
      abi: xCallContractAbi,
      functionName: 'sendCall',
      args: [destination, envelope],
      value: xCallFee.rollback,
    });

    const hash = await walletClient.writeContract(res.request);
    return hash;
  }

  async removeLiquidity(xTransactionInput: XTransactionInput) {
    const { account, inputAmount, poolId, xCallFee } = xTransactionInput;

    if (!poolId) {
      throw new Error('poolId is required');
    }

    const publicClient = this.client.getPublicClient();
    const walletClient = await this.client.getWalletClient();

    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Dex.address}`;
    const amount = BigInt(inputAmount.quotient.toString());
    const data = toHex(getXRemoveData(poolId, amount, true));

    const envelope = toHex(
      RLP.encode([
        Buffer.from([0]),
        data,
        FROM_SOURCES[this.client.xChainId]?.map(Buffer.from),
        TO_SOURCES[this.client.xChainId]?.map(Buffer.from),
      ]),
    );

    const res = await publicClient.simulateContract({
      account: account as Address,
      address: xChainMap[this.client.xChainId].contracts.xCall as Address,
      abi: xCallContractAbi,
      functionName: 'sendCall',
      args: [destination, envelope],
      value: xCallFee.rollback,
    });

    const hash = await walletClient.writeContract(res.request);
    return hash;
  }

  async stake(xTransactionInput: XTransactionInput) {
    const { account, inputAmount, poolId, xCallFee } = xTransactionInput;

    if (!poolId) {
      throw new Error('poolId is required');
    }

    const publicClient = this.client.getPublicClient();
    const walletClient = await this.client.getWalletClient();

    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Dex.address}`;
    const amount = BigInt(inputAmount.quotient.toString());

    const data = toHex(getStakeData(`${ICON_XCALL_NETWORK_ID}/${bnJs.StakedLP.address}`, poolId, amount));

    const envelope = toHex(
      RLP.encode([
        Buffer.from([0]),
        data,
        FROM_SOURCES[this.client.xChainId]?.map(Buffer.from),
        TO_SOURCES[this.client.xChainId]?.map(Buffer.from),
      ]),
    );

    const res = await publicClient.simulateContract({
      account: account as Address,
      address: xChainMap[this.client.xChainId].contracts.xCall as Address,
      abi: xCallContractAbi,
      functionName: 'sendCall',
      args: [destination, envelope],
      value: xCallFee.rollback,
    });

    const hash = await walletClient.writeContract(res.request);
    return hash;
  }

  async unstake(xTransactionInput: XTransactionInput) {
    const { account, inputAmount, poolId, xCallFee } = xTransactionInput;

    if (!poolId) {
      throw new Error('poolId is required');
    }

    const publicClient = this.client.getPublicClient();
    const walletClient = await this.client.getWalletClient();

    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.StakedLP.address}`;
    const amount = BigInt(inputAmount.quotient.toString());
    const data = toHex(getUnStakeData(poolId, amount));

    const envelope = toHex(
      RLP.encode([
        Buffer.from([0]),
        data,
        FROM_SOURCES[this.client.xChainId]?.map(Buffer.from),
        TO_SOURCES[this.client.xChainId]?.map(Buffer.from),
      ]),
    );

    const res = await publicClient.simulateContract({
      account: account as Address,
      address: xChainMap[this.client.xChainId].contracts.xCall as Address,
      abi: xCallContractAbi,
      functionName: 'sendCall',
      args: [destination, envelope],
      value: xCallFee.rollback,
    });

    const hash = await walletClient.writeContract(res.request);
    return hash;
  }

  async claimRewards(xTransactionInput: XTransactionInput) {}
}
