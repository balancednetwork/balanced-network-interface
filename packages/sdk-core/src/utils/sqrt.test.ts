import { MaxUint256 } from '../constants';
import { sqrt } from './sqrt';

describe('#sqrt', () => {
  it('correct for 0-1000', () => {
    for (let i = 0; i < 1000; i++) {
      expect(sqrt(BigInt(i))).toEqual(BigInt(Math.floor(Math.sqrt(i))));
    }
  });

  it('correct for all even powers of 2', async () => {
    for (let i = 0; i < 1000; i++) {
      const root = 2n ** BigInt(i);
      const rootSquared = root * root;

      expect(sqrt(rootSquared)).toEqual(root);
    }
  });

  it('correct for MaxUint256', () => {
    expect(sqrt(MaxUint256)).toEqual(340282366920938463463374607431768211455n);
  });
});
