import { isEmpty, hashShortener, roundNumber, toSeparatedNumberString, shortenNumber } from '../app';

describe('utils/', () => {
  test('isEmpty', () => {
    const emptyObj = {};
    const nonEmptyObj = { a: 1 };

    expect(isEmpty(emptyObj)).toBe(true);
    expect(isEmpty(nonEmptyObj)).toBe(false);
  });

  test('hashShortener', () => {
    const hash = 'hx2ad1356e017a25d53cb7dc256d01aadc619d45d7';

    expect(hashShortener(hash)).toBe('hx2ad1...45d7');
  });

  test('roundNumber', () => {
    const number = 1.12345;

    expect(roundNumber(number)).toBe(1.12);
    expect(roundNumber(number, 4)).toBe(1.1235);
  });

  test('toSeparatedNumberString', () => {
    const number = 1000000.123;

    expect(toSeparatedNumberString(number)).toBe('1,000,000.123');
  });

  test('shortenNumber', () => {
    const n = 10;
    const nM = 100000000;
    const nB = 1000000000;
    const nT = 1000000000000;

    expect(shortenNumber(n)).toBe('10');
    expect(shortenNumber(nM)).toBe('100 M');
    expect(shortenNumber(nB)).toBe('1 B');
    expect(shortenNumber(nT)).toBe('1 T');
  });
});
