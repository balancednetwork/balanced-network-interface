import { encode as rlpEncode } from 'rlp';
import { IconProvider, SwapOrder } from '../entities/index.js';
import IconService, { CallTransactionBuilder, Converter } from 'icon-sdk-js';
import type { Result } from '../types.js';
import { isIconEventLog, isIconTransactionEventLogs } from '../guards.js';
import { ICON_TX_RESULT_WAIT_MAX_RETRY } from '../constants.js';
import { BigNumber } from 'bignumber.js';
import { bigNumberToHex, isValidHex } from './index.js';

export function parseSwapOrder(receipt: IconService.TransactionResult): Result<SwapOrder> {
  if (isIconTransactionEventLogs(receipt)) {
    for (const eventLog of receipt.eventLogs) {
      if (isIconEventLog(eventLog)) {
        if (eventLog.indexed[0] === 'SwapIntent(int,str,str,str,str,str,str,int,str,int,bytes)') {
          return {
            ok: true,
            value: new SwapOrder(
              BigInt(eventLog.indexed[1]!), // id
              eventLog.indexed[2]!, // emitter
              eventLog.indexed[3]!, // srcNID
              eventLog.data[0]!, // dstNID
              eventLog.data[1]!, // creator
              eventLog.data[2]!, // destinationAddress
              eventLog.data[3]!, // token
              BigInt(eventLog.data[4]!), // amount
              eventLog.data[5]!, // toToken
              BigInt(eventLog.data[6]!), // toAmount
              Buffer.from(eventLog.data[7]!, 'hex'), // data
            ),
          };
        }
      } else {
        return {
          ok: false,
          error: new Error('[IconUtils.waitForTransaction] Unexpected even log type'),
        };
      }
    }

    return {
      ok: false,
      error: new Error('Failed to find SwapIntent event in given tx receipt'),
    };
  } else {
    return {
      ok: false,
      error: new Error('[IconUtils.waitForTransaction] receipt is not of type IconTransactionEventLogs'),
    };
  }
}

export async function waitForTransaction(
  txHash: string,
  provider: IconProvider,
): Promise<Result<IconService.TransactionResult>> {
  try {
    let attempt = 0;
    while (attempt < ICON_TX_RESULT_WAIT_MAX_RETRY) {
      try {
        const receipt = await provider.wallet.iconService.getTransactionResult(txHash).execute();

        if (receipt.status === 1) {
          return {
            ok: true,
            value: receipt,
          };
        } else {
          throw new Error('Transaction result not equal to 1');
        }
      } catch (error) {
        attempt++;
        if (attempt >= ICON_TX_RESULT_WAIT_MAX_RETRY) {
          return {
            ok: false,
            error: new Error('[IconUtils.waitForTransaction] max retries exceeded'),
          };
        }
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 sec before retrying
      }
    }

    return {
      ok: false,
      error: new Error(`[IconUtils.waitForTransaction] failed to retrieve transaction result for ${txHash}}`),
    };
  } catch (e) {
    console.error(e);
    return {
      ok: false,
      error: e,
    };
  }
}

export function buildTransaction(
  from: string,
  to: string,
  method: string,
  params: unknown,
  amount?: BigNumber,
): IconService.CallTransaction {
  return new CallTransactionBuilder()
    .from(from)
    .to(to)
    .method(method)
    .params(params)
    .value(amount ? bigNumberToHex(amount) : 0)
    .nid('0x1')
    .nonce('0x1')
    .version('0x3')
    .timestamp(new Date().getTime() * 1000)
    .stepLimit(bigNumberToHex(new BigNumber('20000000'))) // should be overriden by estimateStepCost
    .build();
}

export async function estimateStepCost(tx: any, provider: IconProvider): Promise<BigNumber | undefined> {
  try {
    const response = await fetch(provider.wallet.iconDebugRpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'debug_estimateStep',
        id: 1234,
        params: Converter.toRawTransaction(tx),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch step cost: ${response.statusText}`);
    }

    const data = await response.json();

    return hexToBigNumber(data.result);
  } catch (e) {
    console.error('estimateStepCost error:', e);
    return undefined;
  }
}

export async function estimateAndApplyStepCost(
  tx: IconService.CallTransaction,
  provider: IconProvider,
): Promise<IconService.CallTransaction> {
  const stepLimit = await estimateStepCost(tx, provider);

  if (stepLimit) {
    // 10% buffer
    const stepLimitBuffered = stepLimit.multipliedBy(new BigNumber('1.1')).dp(0);
    tx.stepLimit = bigNumberToHex(stepLimitBuffered);
  }

  return tx;
}

export function hexToBigNumber(value: string): BigNumber {
  if (!value || !isValidHex(value)) {
    return new BigNumber('0');
  }

  return new BigNumber(value, 16);
}

export function BigNumberToBigInt(bigNumber: BigNumber): bigint {
  if (!bigNumber.isInteger()) {
    throw new Error('Cannot convert decimal number to BigInt');
  }
  return BigInt(bigNumber.toFixed(0));
}

export class TokenFallbackData {
  swapOrderData: Uint8Array;
  type: string;
  solver: string | null;

  constructor(swapOrderData: Uint8Array, type: string, solver: string | null = null) {
    this.swapOrderData = swapOrderData;
    this.type = type;
    this.solver = solver;
  }

  /**
   * Converts the TokenFallbackData to RLP encoded bytes for ICON compatibility
   * Matches the Java contract's RLP encoding format
   */
  public toICONBytes(): Uint8Array {
    // Create array of values in the same order as Java contract
    const values = [
      this.swapOrderData, // byte[] -> Uint8Array
      Buffer.from(this.type), // string -> bytes
      this.solver ? Buffer.from(this.solver) : Buffer.from([]), // Address -> bytes or empty for null
    ];

    // RLP encode the array
    return new Uint8Array(rlpEncode(values));
  }

  /**
   * Converts the TokenFallbackData to a hex string with '0x' prefix
   */
  public toHex(): string {
    const bytes = this.toICONBytes();
    return (
      '0x' +
      Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
    );
  }

  /**
   * Creates a TokenFallbackData instance for a swap operation
   */
  public static forSwap(swapOrderData: Uint8Array): TokenFallbackData {
    return new TokenFallbackData(swapOrderData, 'swap', null);
  }

  /**
   * Creates a TokenFallbackData instance for a fill operation
   */
  public static forFill(swapOrderData: Uint8Array, solver: string): TokenFallbackData {
    return new TokenFallbackData(swapOrderData, 'fill', solver);
  }
}
