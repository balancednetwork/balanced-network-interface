import { convertToICX } from '../utils';

describe('connectors/ICONex/utils', () => {
  test('convertToICX', () => {
    const result = convertToICX('0xd3c1c88a84b7b4a80000');

    expect(result).toBe('999994');
  });
});
