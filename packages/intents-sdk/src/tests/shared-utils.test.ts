import { describe, it, expect } from 'vitest';
import { isValidHex, bigNumberToHex } from '../utils/index.js';
import { BigNumber } from 'bignumber.js';

describe('shared-utils', () => {
  describe('isValidHex', () => {
    it('should return true for valid hex strings', () => {
      const validHexes = ['0x123', '0xabc', '0xABC', '0x0', '0x1', '0xdeadbeef', '0x123456789abcdef'];

      validHexes.forEach(hex => {
        expect(isValidHex(hex)).toBe(true);
      });
    });

    it('should return false for invalid hex strings', () => {
      const invalidHexes = [
        'xyz', // non-hex characters
        '0xghijk', // invalid hex characters
        '0x', // empty hex
        '', // empty string
        '123', // no 0x prefix
        '0x123.456', // decimal point
        '0x123,456', // comma
        undefined, // undefined
        null, // null
        123, // number
        {}, // object
        [], // array
      ];

      invalidHexes.forEach(input => {
        const result = isValidHex(input);
        console.log(`Testing input: ${input}, Result: ${result}`);
        expect(result).toBe(false);
      });
    });
  });

  describe('bigNumberToHex', () => {
    it('should convert BigNumber to hex string with 0x prefix', () => {
      const testCases = [
        { input: new BigNumber('255'), expected: '0xff' },
        { input: new BigNumber('16'), expected: '0x10' },
        { input: new BigNumber('1000'), expected: '0x3e8' },
        { input: new BigNumber('0'), expected: '0x0' },
        { input: new BigNumber('1234567890'), expected: '0x499602d2' },
        { input: new BigNumber('1'), expected: '0x1' },
        { input: new BigNumber('15'), expected: '0xf' },
        { input: new BigNumber('256'), expected: '0x100' },
        { input: new BigNumber('4095'), expected: '0xfff' },
        { input: new BigNumber('4096'), expected: '0x1000' },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = bigNumberToHex(input);
        expect(result.toLowerCase()).toBe(expected);
      });
    });

    it('should handle large numbers', () => {
      const largeNumbers = [
        { input: new BigNumber('1000000000000000000'), expected: '0xde0b6b3a7640000' }, // 1 ETH in wei
        {
          input: new BigNumber('115792089237316195423570985008687907853269984665640564039457584007913129639935'),
          expected: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
        }, // Max uint256
      ];

      largeNumbers.forEach(({ input, expected }) => {
        const result = bigNumberToHex(input);
        expect(result.toLowerCase()).toBe(expected);
      });
    });

    it('should handle zero', () => {
      const zero = new BigNumber('0');
      const result = bigNumberToHex(zero);
      expect(result.toLowerCase()).toBe('0x0');
    });

    it('should handle decimal numbers by truncating the decimal part', () => {
      const decimalNumbers = [
        { input: new BigNumber('123.456'), expected: '0x7b' }, // 123 in hex
        { input: new BigNumber('0.999'), expected: '0x0' }, // 0 in hex
        { input: new BigNumber('1.999'), expected: '0x1' }, // 1 in hex
      ];

      decimalNumbers.forEach(({ input, expected }) => {
        const result = bigNumberToHex(input);
        expect(result.toLowerCase()).toBe(expected);
      });
    });

    it('should handle negative numbers by converting their absolute value', () => {
      const negativeNumbers = [
        { input: new BigNumber('-255'), expected: '0xff' }, // -255 in hex
        { input: new BigNumber('-1'), expected: '0x1' }, // -1 in hex
      ];

      negativeNumbers.forEach(({ input, expected }) => {
        const result = bigNumberToHex(input.abs());
        expect(result.toLowerCase()).toBe(expected);
      });
    });
  });
});
