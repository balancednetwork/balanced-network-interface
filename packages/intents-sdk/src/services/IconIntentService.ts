import { stringToBytes } from 'viem';
import { SwapOrder, IconProvider } from '../entities/index.js';
import type { CreateIntentOrderPayload, IconChainConfig, Result, ChainConfig } from '../types.js';
import { Converter as IconConverter } from 'icon-sdk-js';
import {
  buildTransaction,
  estimateAndApplyStepCost,
  parseSwapOrder,
  TokenFallbackData,
  waitForTransaction,
} from '../utils/index.js';
import { BigNumber } from 'bignumber.js';

export class IconIntentService {
  private constructor() {}

  /**
   * Create Icon intent order
   * @param payload - Intent payload
   * @param fromChainConfig - Icon chain config
   * @param toChainConfig - Destination chain config
   * @param provider - Icon provider
   */
  static async createIntentOrder(
    payload: CreateIntentOrderPayload,
    fromChainConfig: IconChainConfig,
    toChainConfig: ChainConfig,
    provider: IconProvider,
  ): Promise<Result<string>> {
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
      const fallbackData = TokenFallbackData.forSwap(intent.toICONBytes());
      const isNative =
        payload.token.toLowerCase() ===
          fromChainConfig.supportedTokens.find(token => token.symbol === 'ICX')?.address.toLowerCase() ||
        payload.token.toLowerCase() === fromChainConfig.nativeToken.toLowerCase();
      const transaction = buildTransaction(
        payload.fromAddress,
        intent.toToken,
        'transfer',
        {
          _to: payload.toAddress,
          _value: IconConverter.toHex(Number(intent.toAmount)),
          _data: fallbackData.toHex(),
        },
        isNative ? new BigNumber(intent.amount.toString()) : undefined,
      );

      const estimatedTx = await estimateAndApplyStepCost(transaction, provider);
      return provider.wallet.sendTransaction(estimatedTx);
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }

  /**
   * Cancel Icon intent order
   * @param orderId - Intent order ID
   * @param chainConfig - Icon chain config
   * @param provider - Icon provider
   */
  public static async cancelIntentOrder(
    orderId: bigint,
    chainConfig: IconChainConfig,
    provider: IconProvider,
  ): Promise<Result<string>> {
    try {
      const transaction = buildTransaction(provider.wallet.getAddress(), chainConfig.intentContract, 'cancel', {
        id: IconConverter.toHex(Number(orderId)),
      });

      const estimatedTx = await estimateAndApplyStepCost(transaction, provider);
      return provider.wallet.sendTransaction(estimatedTx);
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
   * @param chainConfig - SUI chain config
   * @param provider - SUI provider
   */
  static async getOrder(
    txHash: string,
    chainConfig: IconChainConfig,
    provider: IconProvider,
  ): Promise<Result<SwapOrder>> {
    try {
      const txReceiptResult = await waitForTransaction(txHash, provider);

      if (txReceiptResult.ok) {
        const swapOrderResult = parseSwapOrder(txReceiptResult.value);

        if (swapOrderResult.ok) {
          return {
            ok: true,
            value: swapOrderResult.value,
          };
        } else {
          return swapOrderResult;
        }
      } else {
        return txReceiptResult;
      }
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }
}
