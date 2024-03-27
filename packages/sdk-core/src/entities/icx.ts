import invariant from 'tiny-invariant';

import { Currency } from './currency';
import { NativeCurrency } from './nativeCurrency';
import { Token } from './token';
import { WETH9 } from './weth9';

/**
 * ICX is the main usage of a 'native' currency, i.e. for ICON mainnet and all testnets
 */
export class ICX extends NativeCurrency {
  protected constructor(chainId: number) {
    super(chainId, 18, 'ICX', 'ICON');
  }

  public get wrapped(): Token {
    const weth9 = WETH9[this.chainId];
    invariant(!!weth9, 'WRAPPED');
    return weth9;
  }

  private static _etherCache: { [chainId: number]: ICX } = {};

  public static onChain(chainId: number): ICX {
    return this._etherCache[chainId] ?? (this._etherCache[chainId] = new ICX(chainId));
  }

  public equals(other: Currency): boolean {
    return other.isNative && other.chainId === this.chainId;
  }
}
