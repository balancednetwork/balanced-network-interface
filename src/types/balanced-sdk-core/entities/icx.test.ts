import { ICX } from './icx';

describe('ICX', () => {
  it('static constructor uses cache', () => {
    // eslint-disable-next-line no-self-compare
    expect(ICX.onChain(1) === ICX.onChain(1)).toEqual(true);
  });
  it('caches once per chain ID', () => {
    expect(ICX.onChain(1) !== ICX.onChain(2)).toEqual(true);
  });
  it('#equals returns false for diff chains', () => {
    expect(ICX.onChain(1).equals(ICX.onChain(2))).toEqual(false);
  });
  it('#equals returns true for same chains', () => {
    expect(ICX.onChain(1).equals(ICX.onChain(1))).toEqual(true);
  });
});
