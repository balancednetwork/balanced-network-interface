import invariant from 'tiny-invariant';
import { type Address, type Hash, type TransactionReceipt } from 'viem';
import { chainConfig, supportedChains } from '../constants.js';
import {
  type ChainProvider,
  type ChainProviderType,
  EvmProvider,
  type GetChainProviderType,
  IconProvider,
  SuiProvider,
  SwapOrder,
} from '../entities/index.js';
import { isEvmChainConfig, isIconChainConfig, isSuiChainConfig } from '../guards.js';
import {
  type ChainConfig,
  type ChainName,
  type CreateIntentOrderPayload,
  type GetChainConfigType,
  type IntentErrorResponse,
  type IntentExecutionResponse,
  type IntentQuoteRequest,
  type IntentQuoteResponse,
  type IntentServiceConfig,
  type IntentStatusRequest,
  type IntentStatusResponse,
  type Result,
} from '../types.js';
import { EvmIntentService } from './EvmIntentService.js';
import { SolverApiService } from './SolverApiService.js';
import { SuiIntentService } from './SuiIntentService.js';
import { IconIntentService } from './IconIntentService.js';

export class IntentService {
  private readonly config: IntentServiceConfig;

  public constructor(config: IntentServiceConfig) {
    this.config = config;
  }

  /**
   * Get current best quote for token amount
   * @example
   * // request
   * {
   *     "token_src": "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
   *     "token_src_blockchain_id": "0xa4b1.arbitrum",
   *     "token_dst": "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
   *     "token_dst_blockchain_id": "sui",
   *     "src_amount": 10000n
   * }
   *
   * // response
   * {
   *   "ok": true,
   *   "value": {
   *      "output": {
   *        "expected_output":"981301300",
   *        "uuid":"e2795d2c-14a5-4d18-9be6-a257d7c9d274"
   *      }
   *   }
   * }
   */
  public async getQuote(payload: IntentQuoteRequest): Promise<Result<IntentQuoteResponse, IntentErrorResponse>> {
    return SolverApiService.getQuote(payload, this.config);
  }

  /**
   * Check whether intent contract is allowed to move the given payload amount
   * @param payload -Intent payload
   * @param provider - ChainProviderType
   * @return Boolean - valid = true, invalid = false
   */
  public async isAllowanceValid<T extends CreateIntentOrderPayload>(
    payload: CreateIntentOrderPayload,
    provider: GetChainProviderType<T['fromChain']>,
  ): Promise<Result<boolean>> {
    invariant(payload.amount > 0n, 'Invalid amount');

    try {
      const fromChainConfig = chainConfig[payload.fromChain];

      if (!fromChainConfig) {
        return {
          ok: false,
          error: `Unsupported fromChain: ${payload.fromChain}`,
        };
      }

      if (isEvmChainConfig(fromChainConfig)) {
        if (provider instanceof EvmProvider) {
          return EvmIntentService.isAllowanceValid(
            payload.token as Address,
            payload.amount,
            payload.fromAddress as Address,
            fromChainConfig,
            provider,
          );
        } else {
          return {
            ok: false,
            error: new Error(`[IntentService.isAllowanceValid] provider should be of type EvmProvider`),
          };
        }
      } else if (isSuiChainConfig(fromChainConfig || isIconChainConfig(fromChainConfig))) {
        // no allowance supported/required on SUI or Icon
        return {
          ok: true,
          value: true,
        };
      } else {
        return {
          ok: false,
          error: new Error(`${payload.fromChain} chain not supported`),
        };
      }
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
  public async approve(
    token: Address,
    amount: bigint,
    address: Address,
    provider: EvmProvider,
  ): Promise<Result<TransactionReceipt>> {
    return EvmIntentService.approve(token, amount, address, provider);
  }

  /**
   * Execute intent order
   * @example
   * // request
   * {
   *     "quote_uuid": "a0dd7652-b360-4123-ab2d-78cfbcd20c6b",
   *     "fromAddress": "0x601020c5797Cdd34f64476b9bf887a353150Cb9a",
   *     "toAddress": "0x81600ec58a2efd97f41380370cddf25b7a416d03ee081552becfa9710ea30878",
   *     "fromChain": "0xa4b1.arbitrum",
   *     "toChain": "sui",
   *     "token": "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
   *     "amount": "10000",
   *     "toToken": "0x2::sui::SUI",
   *     "toAmount": "9813013000",
   * }
   *
   * // response
   * {
   *   "ok": true,
   *   "value": {
   *      "output": {
   *        "answer":"OK",
   *        "task_id":"a0dd7652-b360-4123-ab2d-78cfbcd20c6b"
   *      }
   *   }
   * }
   */
  public async executeIntentOrder<T extends CreateIntentOrderPayload>(
    payload: CreateIntentOrderPayload,
    provider: GetChainProviderType<T['fromChain']>,
  ): Promise<Result<IntentExecutionResponse, IntentErrorResponse | Error | unknown>> {
    try {
      const intentOrderResult = await this.createIntentOrder(payload, provider);

      if (intentOrderResult.ok) {
        return SolverApiService.postExecution(
          {
            intent_tx_hash: intentOrderResult.value,
            quote_uuid: payload.quote_uuid,
          },
          this.config,
        );
      } else {
        return intentOrderResult;
      }
    } catch (e: any) {
      return {
        ok: false,
        error: e,
      };
    }
  }

  public async createIntentOrder<T extends CreateIntentOrderPayload>(
    payload: T,
    provider: GetChainProviderType<T['fromChain']>,
  ): Promise<Result<Hash | string>> {
    try {
      const fromChainConfig = this.getChainConfig(payload.fromChain);
      const toChainConfig = this.getChainConfig(payload.toChain);

      if (isEvmChainConfig(fromChainConfig)) {
        if (provider instanceof EvmProvider) {
          return EvmIntentService.createIntentOrder(payload, fromChainConfig, toChainConfig, provider);
        } else {
          return {
            ok: false,
            error: new Error(`[IntentService.createIntentOrder] provider should be of type EvmProvider`),
          };
        }
      } else if (isSuiChainConfig(fromChainConfig)) {
        if (provider instanceof SuiProvider) {
          return SuiIntentService.createIntentOrder(payload, fromChainConfig, toChainConfig, provider);
        } else {
          return {
            ok: false,
            error: new Error(`[IntentService.createIntentOrder] provider should be of type SuiProvider`),
          };
        }
      } else if (isIconChainConfig(fromChainConfig)) {
        if (provider instanceof IconProvider) {
          return IconIntentService.createIntentOrder(payload, fromChainConfig, toChainConfig, provider);
        } else {
          return {
            ok: false,
            error: new Error(`[IntentService.createIntentOrder] provider should be of type IconProvider`),
          };
        }
      } else {
        return {
          ok: false,
          error: new Error(`${payload.fromChain} chain not supported`),
        };
      }
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }

  /**
   * Cancel active Intent Order
   * @param orderId - Intent Order ID (retrievable by getOrder)
   * @param chain - Chain on which Order was created on
   * @param provider - EVM or SUI provider
   * @return string - Transaction Hash
   */
  public async cancelIntentOrder(
    orderId: bigint,
    chain: ChainName,
    provider: ChainProviderType,
  ): Promise<Result<string>> {
    try {
      const chainConfig = this.getChainConfig(chain);

      if (isEvmChainConfig(chainConfig)) {
        if (provider instanceof EvmProvider) {
          return EvmIntentService.cancelIntentOrder(orderId, chainConfig, provider);
        } else {
          return {
            ok: false,
            error: new Error(`[IntentService.cancelIntentOrder] provider should be of type EvmProvider`),
          };
        }
      } else if (isSuiChainConfig(chainConfig)) {
        if (provider instanceof SuiProvider) {
          return SuiIntentService.cancelIntentOrder(orderId, chainConfig, provider);
        } else {
          return {
            ok: false,
            error: new Error(`[IntentService.cancelIntentOrder] provider should be of type SuiProvider`),
          };
        }
      } else if (isIconChainConfig(chainConfig)) {
        if (provider instanceof IconProvider) {
          return IconIntentService.cancelIntentOrder(orderId, chainConfig, provider);
        } else {
          return {
            ok: false,
            error: new Error(`IntentService.cancelIntentOrder] provider should be of type IconProvider`),
          };
        }
      } else {
        return {
          ok: false,
          error: new Error(`${chain} chain not supported`),
        };
      }
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
   * @param chain - chain name (sui or arb)
   * @param provider - provider (EVM or SUI)
   */
  public async getOrder<T extends ChainConfig>(
    txHash: string,
    chain: ChainName,
    provider: ChainProvider<T['chain']['type']>,
  ): Promise<Result<SwapOrder>> {
    const chainConfig = this.getChainConfig(chain);

    if (provider instanceof EvmProvider && isEvmChainConfig(chainConfig)) {
      return EvmIntentService.getOrder(txHash as Address, chainConfig, provider);
    } else if (provider instanceof SuiProvider && isSuiChainConfig(chainConfig)) {
      return SuiIntentService.getOrder(txHash, chainConfig, provider);
    } else if (provider instanceof IconProvider && isIconChainConfig(chainConfig)) {
      return IconIntentService.getOrder(txHash, chainConfig, provider);
    } else {
      return {
        ok: false,
        error: new Error('Provider and chainConfig miss match'),
      };
    }
  }

  /**
   * Get current intent status
   * @example
   * // request
   * {
   *     "task_id": "a0dd7652-b360-4123-ab2d-78cfbcd20c6b"
   * }
   *
   * // response
   * {
   *   "ok": true,
   *   "value": {
   *      "output": {
   *        "status":3,
   *        "tx_hash":"0xabcdefasdasdsafssadasdsadsadasdsadasdsadsa"
   *      }
   *   }
   * }
   */
  public async getStatus(
    intentStatusRequest: IntentStatusRequest,
  ): Promise<Result<IntentStatusResponse, IntentErrorResponse>> {
    return SolverApiService.getStatus(intentStatusRequest, this.config);
  }

  /**
   * Get all available chains supporting intents
   */
  public getSupportedChains(): ChainName[] {
    return supportedChains;
  }

  /**
   * Get config of a specific chain
   */
  public getChainConfig<T extends ChainName>(chain: T): GetChainConfigType<T> {
    const data = chainConfig[chain];

    if (!chainConfig) {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    return data as GetChainConfigType<T>;
  }
}
