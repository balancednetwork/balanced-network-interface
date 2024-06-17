import invariant from 'tiny-invariant';

import { Currency, Price, Token } from '@balancednetwork/sdk-core';

import { Pair } from './pair';

export type RouteAction = {
  type: number;
  address: string | null;
};

export class Route<TInput extends Currency, TOutput extends Currency> {
  public readonly pairs: Pair[];
  public readonly path: Token[];
  public readonly input: TInput;
  public readonly output: TOutput;
  public readonly externalNativeTokens: string[] = ['ARCH'];

  public constructor(pairs: Pair[], input: TInput, output: TOutput) {
    invariant(pairs.length > 0, 'PAIRS');
    const chainId: number | string = pairs[0].chainId;
    invariant(
      pairs.every(pair => pair.chainId === chainId),
      'CHAIN_IDS',
    );

    const wrappedInput = input.wrapped;
    invariant(pairs[0].involvesToken(wrappedInput), 'INPUT');
    invariant(typeof output === 'undefined' || pairs[pairs.length - 1].involvesToken(output.wrapped), 'OUTPUT');

    const path: Token[] = [wrappedInput];
    /* @ts-ignore */
    for (const [i, pair] of pairs.entries()) {
      const currentInput = path[i];
      invariant(currentInput.equals(pair.token0) || currentInput.equals(pair.token1), 'PATH');
      const output = currentInput.equals(pair.token0) ? pair.token1 : pair.token0;
      path.push(output);
    }

    this.pairs = pairs;
    this.path = path;
    this.input = input;
    this.output = output;
  }

  private _midPrice: Price<TInput, TOutput> | null = null;

  public get midPrice(): Price<TInput, TOutput> {
    if (this._midPrice !== null) return this._midPrice;
    const prices: Price<Currency, Currency>[] = [];
    /* @ts-ignore */
    for (const [i, pair] of this.pairs.entries()) {
      if (pair.isStabilityFund) {
        let price;
        // pair.token1 is always bnUSD
        if (this.path[i].symbol === 'bnUSD') {
          // bnUSD -> USDC
          price = new Price(
            pair.token1,
            pair.token0,
            10n ** BigInt(pair.token1.decimals),
            10n ** BigInt(pair.token0.decimals),
          );
        } else {
          // USDC -> bnUSD
          price = new Price(
            pair.token0,
            pair.token1,
            10n ** BigInt(pair.token0.decimals),
            10n ** BigInt(pair.token1.decimals),
          );
        }
        prices.push(price);
      } else {
        prices.push(
          this.path[i].equals(pair.token0)
            ? new Price(pair.reserve0.currency, pair.reserve1.currency, pair.reserve0.quotient, pair.reserve1.quotient)
            : new Price(pair.reserve1.currency, pair.reserve0.currency, pair.reserve1.quotient, pair.reserve0.quotient),
        );
      }
    }

    const reduced = prices
      .slice(1)
      .reduce((accumulator, currentValue) => accumulator.multiply(currentValue), prices[0]);
    return (this._midPrice = new Price(this.input, this.output, reduced.denominator, reduced.numerator));
  }

  public get chainId(): number | string {
    return this.pairs[0].chainId;
  }

  public get pathForSwap(): (string | null)[] {
    return this.path
      .map((token: Token) => {
        if (token.symbol === 'ICX') {
          return null;
        }
        if (this.externalNativeTokens.includes(token.symbol!)) {
          return [token.address, null];
        }
        return token.address;
      })
      .slice(1)
      .flat();
  }

  public get routeActionPath(): RouteAction[] {
    const path: RouteAction[] = [];
    for (let i = 0; i < this.pairs.length; i++) {
      const pair: Pair = this.pairs[i];
      path.push({ type: pair.isStabilityFund ? 2 : 1, address: this.pathForSwap[i] });
    }
    return path;
  }
}
