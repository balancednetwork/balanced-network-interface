import {
  IntentErrorCode,
  type IntentExecutionRequest,
  type IntentErrorResponse,
  type IntentQuoteRequest,
  type IntentQuoteResponse,
  type IntentExecutionResponse,
  type IntentStatusRequest,
  type IntentStatusResponse,
  type Result,
  type IntentQuoteResponseRaw,
  type IntentServiceConfig,
} from '../types.js';
import invariant from 'tiny-invariant';
import { retry } from '../utils/index.js';

export class SolverApiService {
  private constructor() {}

  public static async getQuote(
    payload: IntentQuoteRequest,
    config: IntentServiceConfig,
  ): Promise<Result<IntentQuoteResponse, IntentErrorResponse>> {
    invariant(payload.token_src.length > 0, 'Empty token_src');
    invariant(payload.token_src_blockchain_id.length > 0, 'Empty token_src_blockchain_id');
    invariant(payload.token_dst.length > 0, 'Empty token_dst');
    invariant(payload.token_dst_blockchain_id.length > 0, 'Empty token_dst_blockchain_id');
    invariant(payload.src_amount > 0n, 'src_amount must be greater than 0');

    try {
      const response = await fetch(`${config.solverApiEndpoint}/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token_src: payload.token_src,
          token_src_blockchain_id: payload.token_src_blockchain_id,
          token_dst: payload.token_dst,
          token_dst_blockchain_id: payload.token_dst_blockchain_id,
          src_amount: payload.src_amount.toString(),
        }),
      });

      if (!response.ok) {
        return {
          ok: false,
          error: await response.json(),
        };
      }

      const quoteResponse: IntentQuoteResponseRaw = await response.json();

      return {
        ok: true,
        value: {
          output: {
            expected_output: BigInt(quoteResponse.output.expected_output),
            uuid: quoteResponse.output.uuid,
          },
        } satisfies IntentQuoteResponse,
      };
    } catch (e: any) {
      console.error(`[SolverApiService.getQuote] failed. Details: ${JSON.stringify(e)}`);
      return {
        ok: false,
        error: {
          detail: {
            code: IntentErrorCode.UNKNOWN,
            message: e ? e.message ?? JSON.stringify(e) : 'Unknown error',
          },
        },
      };
    }
  }

  /**
   * Execute intent order
   * @example
   * // request
   * {
   *     "intent_tx_hash": "0xba3dce19347264db32ced212ff1a2036f20d9d2c7493d06af15027970be061af",
   *     "quote_uuid": "a0dd7652-b360-4123-ab2d-78cfbcd20c6b"
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
  public static async postExecution(
    intentExecutionRequest: IntentExecutionRequest,
    config: IntentServiceConfig,
  ): Promise<Result<IntentExecutionResponse, IntentErrorResponse>> {
    try {
      const response = await retry(() =>
        fetch(`${config.solverApiEndpoint}/execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(intentExecutionRequest),
        }),
      );

      if (!response.ok) {
        return {
          ok: false,
          error: await response.json(),
        };
      }

      return {
        ok: true,
        value: await response.json(),
      };
    } catch (e: any) {
      console.error(`[SolverApiService.postExecution] failed. Details: ${JSON.stringify(e)}`);
      return {
        ok: false,
        error: {
          detail: {
            code: IntentErrorCode.UNKNOWN,
            message: e ? e.message ?? JSON.stringify(e) : 'Unknown error',
          },
        },
      };
    }
  }

  public static async getStatus(
    intentStatusRequest: IntentStatusRequest,
    config: IntentServiceConfig,
  ): Promise<Result<IntentStatusResponse, IntentErrorResponse>> {
    invariant(intentStatusRequest.task_id.length > 0, 'Empty task_id');
    try {
      const response = await fetch(`${config.solverApiEndpoint}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(intentStatusRequest),
      });

      if (!response.ok) {
        return {
          ok: false,
          error: await response.json(),
        };
      }

      return {
        ok: true,
        value: await response.json(),
      };
    } catch (e: any) {
      console.error(`[SolverApiService.getStatus] failed. Details: ${JSON.stringify(e)}`);
      return {
        ok: false,
        error: {
          detail: {
            code: IntentErrorCode.UNKNOWN,
            message: e ? e.message ?? JSON.stringify(e) : 'Unknown error',
          },
        },
      };
    }
  }
}
