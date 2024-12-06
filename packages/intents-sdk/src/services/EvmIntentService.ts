import { type Address, type Hash, type TransactionReceipt, parseEventLogs, stringToBytes } from 'viem';
import { erc20Abi, intentAbi } from '../abis/index.js';
import { EvmProvider, SwapOrder } from '../entities/index.js';
import type { ChainConfig, CreateIntentOrderPayload, EvmChainConfig, Result } from '../types.js';

export class EvmIntentService {
  private constructor() {}

  /**
   * Check if intent contract has enough ERC20 allowance for given amount
   * @param token - ERC20 token address
   * @param amount - Amount to check allowance for
   * @param userAddress - User wallet address
   * @param chainConfig - Chain config
   * @param provider - EVM Provider
   * @return - True if intent contract is allowed to spend amount on behalf of user
   */
  static async isAllowanceValid(
    token: Address,
    amount: bigint,
    userAddress: Address,
    chainConfig: EvmChainConfig,
    provider: EvmProvider,
  ): Promise<Result<boolean>> {
    try {
      if (token === chainConfig.nativeToken) {
        return {
          ok: true,
          value: true,
        };
      }

      const allowedAmount = await provider.publicClient.readContract({
        address: token,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [userAddress, chainConfig.intentContract],
      });

      return {
        ok: true,
        value: allowedAmount >= amount,
      };
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }

  /**
   * Approve ERC20 amount spending
   * @param token - ERC20 token address
   * @param amount - Amount to approve
   * @param address - Address to approve spending for
   * @param provider - EVM Provider
   */
  static async approve(
    token: Address,
    amount: bigint,
    address: Address,
    provider: EvmProvider,
  ): Promise<Result<TransactionReceipt>> {
    try {
      const hash = await provider.walletClient.writeContract({
        address: token,
        abi: erc20Abi,
        functionName: 'approve',
        args: [address, amount],
      });

      return {
        ok: true,
        value: await provider.publicClient.waitForTransactionReceipt({ hash }),
      };
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }

  /**
   * Create EVM intent order
   * @param payload - Intent payload
   * @param fromChainConfig - EVM chain config
   * @param toChainConfig - Destination chain config
   * @param provider - EVM provider
   */
  static async createIntentOrder(
    payload: CreateIntentOrderPayload,
    fromChainConfig: EvmChainConfig,
    toChainConfig: ChainConfig,
    provider: EvmProvider,
  ): Promise<Result<Hash>> {
    try {
      const intent = new SwapOrder(
        0n,
        fromChainConfig.intentContract,
        fromChainConfig.nid,
        toChainConfig.nid,
        payload.fromAddress,
        payload.toAddress,
        payload.token,
        payload.amount,
        payload.toToken,
        payload.toAmount,
        stringToBytes(
          JSON.stringify({
            quote_uuid: payload.quote_uuid,
          }),
        ),
      );

      const isNative = payload.token.toLowerCase() === fromChainConfig.nativeToken.toLowerCase();

      return {
        ok: true,
        value: await provider.walletClient.writeContract({
          address: fromChainConfig.intentContract,
          abi: intentAbi,
          functionName: 'swap',
          args: [intent.toObjectData()],
          value: isNative ? intent.amount : undefined,
        }),
      };
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }

  /**
   * Cancel EVM intent order
   * @param orderId - Intent order ID
   * @param chainConfig - EVM chain config
   * @param provider - EVM provider
   */
  static async cancelIntentOrder(
    orderId: bigint,
    chainConfig: EvmChainConfig,
    provider: EvmProvider,
  ): Promise<Result<Hash>> {
    try {
      return {
        ok: true,
        value: await provider.walletClient.writeContract({
          address: chainConfig.intentContract,
          abi: intentAbi,
          functionName: 'cancel',
          args: [orderId],
        }),
      };
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }

  /**
   * Retrieve Intent order
   * @param txHash - Transaction hash
   * @param chainConfig - EVM chain config
   * @param provider - EVM provider
   */
  static async getOrder(txHash: Hash, chainConfig: EvmChainConfig, provider: EvmProvider): Promise<Result<SwapOrder>> {
    try {
      const receipt = await provider.publicClient.waitForTransactionReceipt({ hash: txHash });
      const logs = parseEventLogs({
        abi: intentAbi,
        eventName: 'SwapIntent',
        logs: receipt.logs,
      });

      for (const log of logs) {
        if (log.address.toLowerCase() === chainConfig.intentContract.toLowerCase()) {
          return {
            ok: true,
            value: new SwapOrder(
              log.args.id,
              log.args.emitter,
              log.args.srcNID,
              log.args.dstNID,
              log.args.creator,
              log.args.destinationAddress,
              log.args.token,
              log.args.amount,
              log.args.toToken,
              log.args.toAmount,
              Buffer.from(log.args.data, 'hex'),
            ),
          };
        }
      }

      return {
        ok: false,
        error: new Error(`No order found for ${txHash}`),
      };
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }
}
