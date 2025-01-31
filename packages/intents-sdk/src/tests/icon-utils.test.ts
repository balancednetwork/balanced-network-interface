import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest';
import {
  parseSwapOrder,
  waitForTransaction,
  buildTransaction,
  estimateStepCost,
  estimateAndApplyStepCost,
  hexToBigNumber,
  TokenFallbackData,
  bigNumberToHex,
  BigNumberToBigInt,
} from '../utils/index.js';
import { BigNumber } from 'bignumber.js';
import { IconProvider } from '../entities/index.js';

global.fetch = vi.fn();

function createFetchResponse(data: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => data,
  } as Response;
}

// Add type for the error result
interface ErrorResult {
  ok: false;
  error: Error;
}

describe('icon-utils', () => {
  describe('parseSwapOrder', () => {
    it('should successfully parse a valid swap order receipt', () => {
      const mockReceipt = {
        eventLogs: [
          {
            indexed: ['SwapIntent(int,str,str,str,str,str,str,int,str,int,bytes)', '123', 'emitter123', 'srcNID123'],
            data: [
              'dstNID123',
              'creator123',
              'dest123',
              'token123',
              '1000',
              'toToken123',
              '2000',
              '1234', // hex string for data
            ],
            scoreAddress: 'mockAddress',
          },
        ],
      };

      const result = parseSwapOrder(mockReceipt as any);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe(123n);
        expect(result.value.emitter).toBe('emitter123');
        expect(result.value.srcNID).toBe('srcNID123');
        expect(result.value.dstNID).toBe('dstNID123');
        expect(result.value.creator).toBe('creator123');
        expect(result.value.destinationAddress).toBe('dest123');
        expect(result.value.token).toBe('token123');
        expect(result.value.amount).toBe(1000n);
        expect(result.value.toToken).toBe('toToken123');
        expect(result.value.toAmount).toBe(2000n);
      }
    });

    it('should return error for non-SwapIntent event', () => {
      const mockReceipt = {
        eventLogs: [
          {
            indexed: ['OtherEvent', '123'],
            data: ['someData'],
            scoreAddress: 'mockAddress',
          },
        ],
      };

      const result = parseSwapOrder(mockReceipt as any);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        const errorResult = result as ErrorResult;
        expect(errorResult.error.message).toContain('Failed to find SwapIntent event');
      }
    });
  });

  describe('waitForTransaction', () => {
    let mockProvider: IconProvider;

    beforeEach(() => {
      mockProvider = {
        wallet: {
          iconService: {
            getTransactionResult: vi.fn().mockReturnValue({
              execute: vi.fn(),
            }),
          },
          iconDebugRpcUrl: 'mock-url',
        },
      } as any;

      vi.clearAllMocks();
    });

    it('should return success when transaction is confirmed', async () => {
      const mockExecute = vi.fn().mockResolvedValue({ status: 1 });
      mockProvider.wallet.iconService.getTransactionResult = vi.fn().mockReturnValue({
        execute: mockExecute,
      });

      const result = await waitForTransaction('mockTxHash', mockProvider);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.status).toBe(1);
      }
      expect(mockExecute).toHaveBeenCalledTimes(1);
    });

    it('should handle failed transaction status', async () => {
      const mockExecute = vi.fn().mockResolvedValueOnce({ status: 0 }).mockResolvedValueOnce({ status: 1 });
      mockProvider.wallet.iconService.getTransactionResult = vi.fn().mockReturnValue({
        execute: mockExecute,
      });

      const result = await waitForTransaction('mockTxHash', mockProvider);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.status).toBe(1);
      }
      expect(mockExecute).toHaveBeenCalledTimes(2);
    }, 10000); // Increase timeout
  });

  describe('buildTransaction', () => {
    it('should build a transaction with correct parameters', () => {
      const tx = buildTransaction(
        'fromAddress',
        'toAddress',
        'methodName',
        { param1: 'value1' },
        new BigNumber('1000'),
      );

      expect(tx.from).toBe('fromAddress');
      expect(tx.to).toBe('toAddress');
      expect(tx.data.method).toBe('methodName');
      expect(tx.value).toBe('0x3e8'); // 1000 in hex
    });
  });

  describe('estimateStepCost', () => {
    let mockProvider: IconProvider;

    beforeEach(() => {
      mockProvider = {
        wallet: {
          iconDebugRpcUrl: 'https://localhost:9080/api/v3',
        },
      } as any;
      global.fetch = vi.fn();
    });

    it('should return estimated step cost', async () => {
      (global.fetch as MockedFunction<typeof fetch>).mockResolvedValue(createFetchResponse({ result: '0x1234' }));

      const result = await estimateStepCost({}, mockProvider);
      expect(result).toBeDefined();
      expect(result instanceof BigNumber).toBe(true);
    });

    it('should return undefined on error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      (global.fetch as MockedFunction<typeof fetch>).mockRejectedValueOnce(new Error('Network error'));

      const result = await estimateStepCost({}, mockProvider);
      expect(result).toBeUndefined();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('hexToBigNumber', () => {
    it('should convert hex string to BigNumber', () => {
      const result = hexToBigNumber('0x1234');
      expect(bigNumberToHex(result)).toBe('0x1234');
      expect(+result).toBe(4660);
    });

    it('should multiply BigNumber with a regular number', () => {
      const tmp = hexToBigNumber('0x1234');
      const result = tmp.multipliedBy(2).dp(0);
      expect(result.toString()).toBe('9320');
    });

    it('should divide BigNumber with a regular number', () => {
      const tmp = hexToBigNumber('0x1234');
      const result = tmp.dividedBy(2).dp(0);
      expect(result.toString()).toBe('2330');
    });
  });

  describe('estimateAndApplyStepCost', () => {
    let mockProvider: IconProvider;

    beforeEach(() => {
      mockProvider = {
        wallet: {
          iconDebugRpcUrl: 'mock-url',
        },
      } as any;
    });

    it('should apply estimated step cost with buffer', async () => {
      (global.fetch as MockedFunction<typeof fetch>).mockResolvedValue(createFetchResponse({ result: '0x2710' }));

      const mockTx = buildTransaction('fromAddress', 'toAddress', 'methodName', { param1: 'value1' });

      const result = await estimateAndApplyStepCost(mockTx, mockProvider);
      expect(result.stepLimit).toBeDefined();
      // Should be original value * 1.1 (10% buffer)
      expect(new BigNumber(result.stepLimit, 16).toString(10)).toBe('11000');
    });
  });

  describe('TokenFallbackData', () => {
    it('should correctly RLP encode data', () => {
      const mockData = new Uint8Array([1, 2, 3]);
      const tokenData = TokenFallbackData.forSwap(mockData);
      const hex = tokenData.toHex();

      // Verify the hex string format
      expect(hex).toMatch(/^0x[0-9a-f]+$/i);

      // Create another instance and verify data consistency
      const fillData = TokenFallbackData.forFill(mockData, 'solver123');
      const fillHex = fillData.toHex();
      expect(fillHex).toMatch(/^0x[0-9a-f]+$/i);
      expect(fillHex).not.toBe(hex); // Should be different due to different type and solver
    });
  });

  describe('bigNumberToHex', () => {
    it('should convert BigNumber to hex string with 0x prefix', () => {
      const tests = [
        { input: new BigNumber('255'), expected: '0xff' },
        { input: new BigNumber('1000'), expected: '0x3e8' },
        { input: new BigNumber('0'), expected: '0x0' },
        { input: new BigNumber('16'), expected: '0x10' },
      ];

      tests.forEach(({ input, expected }) => {
        const result = bigNumberToHex(input);
        expect(result.toLowerCase()).toBe(expected);
      });
    });

    it('should handle large numbers', () => {
      const largeNum = new BigNumber('1000000000000000000'); // 1 ICX in loop
      const result = bigNumberToHex(largeNum);
      expect(result.toLowerCase()).toBe('0xde0b6b3a7640000');
    });
  });

  describe('BigInt and BigNumber conversions', () => {
    it('should correctly convert between BigNumber and BigInt', () => {
      const tests = [
        { input: 255n, expected: '255' },
        { input: 1000n, expected: '1000' },
        { input: 0n, expected: '0' },
        { input: 16n, expected: '16' },
        { input: 1000000000000000000n, expected: '1000000000000000000' },
      ];

      tests.forEach(({ input, expected }) => {
        // BigInt to BigNumber
        const bigNumber = new BigNumber(input.toString());
        expect(bigNumber.toString()).toBe(expected);

        // BigNumber to BigInt
        const bigInt = BigNumberToBigInt(bigNumber);
        expect(bigInt).toBe(input);
      });
    });

    it('should handle very large numbers', () => {
      const largeBigInt = 1234567890123456789012345678901234567890n;
      const bigNumber = new BigNumber(largeBigInt.toString());

      const convertedBack = BigNumberToBigInt(bigNumber);
      expect(convertedBack).toBe(largeBigInt);
    });

    it('should throw on decimal numbers', () => {
      const decimalBigNumber = new BigNumber('123.456');
      expect(() => BigNumberToBigInt(decimalBigNumber)).toThrow();
    });
  });
});
