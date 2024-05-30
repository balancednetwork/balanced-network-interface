import { Ether, CurrencyAmount, Percent, Token, TradeType, WETH9, Price } from '@balancednetwork/sdk-core';

import { Pair } from './pair';
import { Route } from './route';
import { Trade } from './trade';

describe('Trade', () => {
  const ETHER = Ether.onChain(1);
  const token0 = new Token(1, '0x0000000000000000000000000000000000000001', 18, 't0');
  const token1 = new Token(1, '0x0000000000000000000000000000000000000002', 18, 't1');
  const token2 = new Token(1, '0x0000000000000000000000000000000000000003', 18, 't2');
  const token3 = new Token(1, '0x0000000000000000000000000000000000000004', 18, 't3');

  const pair_0_1 = new Pair(CurrencyAmount.fromRawAmount(token0, 1000n), CurrencyAmount.fromRawAmount(token1, 1000n));
  const pair_0_2 = new Pair(CurrencyAmount.fromRawAmount(token0, 1000n), CurrencyAmount.fromRawAmount(token2, 1100n));
  const pair_0_3 = new Pair(CurrencyAmount.fromRawAmount(token0, 1000n), CurrencyAmount.fromRawAmount(token3, 900n));
  const pair_1_2 = new Pair(CurrencyAmount.fromRawAmount(token1, 1200n), CurrencyAmount.fromRawAmount(token2, 1000n));
  const pair_1_3 = new Pair(CurrencyAmount.fromRawAmount(token1, 1200n), CurrencyAmount.fromRawAmount(token3, 1300n));

  const pair_weth_0 = new Pair(
    CurrencyAmount.fromRawAmount(WETH9[1], 1000n),
    CurrencyAmount.fromRawAmount(token0, 1000n),
  );

  const empty_pair_0_1 = new Pair(CurrencyAmount.fromRawAmount(token0, 0n), CurrencyAmount.fromRawAmount(token1, 0n));

  it('can be constructed with ETHER as input', () => {
    const trade = new Trade(
      new Route([pair_weth_0], ETHER, token0),
      CurrencyAmount.fromRawAmount(Ether.onChain(1), 100n),
      TradeType.EXACT_INPUT,
    );
    expect(trade.inputAmount.currency).toEqual(ETHER);
    expect(trade.outputAmount.currency).toEqual(token0);
  });
  it('can be constructed with ETHER as input for exact output', () => {
    const trade = new Trade(
      new Route([pair_weth_0], ETHER, token0),
      CurrencyAmount.fromRawAmount(token0, 100n),
      TradeType.EXACT_OUTPUT,
    );
    expect(trade.inputAmount.currency).toEqual(ETHER);
    expect(trade.outputAmount.currency).toEqual(token0);
  });

  it('can be constructed with ETHER as output', () => {
    const trade = new Trade(
      new Route([pair_weth_0], token0, ETHER),
      CurrencyAmount.fromRawAmount(Ether.onChain(1), 100n),
      TradeType.EXACT_OUTPUT,
    );
    expect(trade.inputAmount.currency).toEqual(token0);
    expect(trade.outputAmount.currency).toEqual(ETHER);
  });
  it('can be constructed with ETHER as output for exact input', () => {
    const trade = new Trade(
      new Route([pair_weth_0], token0, ETHER),
      CurrencyAmount.fromRawAmount(token0, 100n),
      TradeType.EXACT_INPUT,
    );
    expect(trade.inputAmount.currency).toEqual(token0);
    expect(trade.outputAmount.currency).toEqual(ETHER);
  });

  describe('#bestTradeExactIn', () => {
    it('throws with empty pairs', () => {
      expect(() => Trade.bestTradeExactIn([], CurrencyAmount.fromRawAmount(token0, 100n), token2)).toThrow('PAIRS');
    });
    it('throws with max hops of 0', () => {
      expect(() =>
        Trade.bestTradeExactIn([pair_0_2], CurrencyAmount.fromRawAmount(token0, 100n), token2, {
          maxHops: 0,
        }),
      ).toThrow('MAX_HOPS');
    });

    it('provides best route', () => {
      const result = Trade.bestTradeExactIn(
        [pair_0_1, pair_0_2, pair_1_2],
        CurrencyAmount.fromRawAmount(token0, 100n),
        token2,
      );
      expect(result).toHaveLength(3);
      expect(result[1][0].route.pairs).toHaveLength(1); // 0 -> 2 at 10:11
      expect(result[1][0].route.path).toEqual([token0, token2]);
      expect(result[1][0].inputAmount).toEqual(CurrencyAmount.fromRawAmount(token0, 100n));
      expect(result[1][0].outputAmount).toEqual(CurrencyAmount.fromRawAmount(token2, 99n));
      expect(result[2][0].route.pairs).toHaveLength(2); // 0 -> 1 -> 2 at 12:12:10
      expect(result[2][0].route.path).toEqual([token0, token1, token2]);
      expect(result[2][0].inputAmount).toEqual(CurrencyAmount.fromRawAmount(token0, 100n));
      expect(result[2][0].outputAmount).toEqual(CurrencyAmount.fromRawAmount(token2, 69n));
    });

    it('doesnt throw for zero liquidity pairs', () => {
      expect(Trade.bestTradeExactIn([empty_pair_0_1], CurrencyAmount.fromRawAmount(token0, 100n), token1)).toHaveLength(
        0,
      );
    });

    it('respects maxHops', () => {
      const result = Trade.bestTradeExactIn(
        [pair_0_1, pair_0_2, pair_1_2],
        CurrencyAmount.fromRawAmount(token0, 10n),
        token2,
        { maxHops: 1 },
      );
      expect(result).toHaveLength(2);
      expect(result[1][0].route.pairs).toHaveLength(1); // 0 -> 2 at 10:11
      expect(result[1][0].route.path).toEqual([token0, token2]);
    });

    it('insufficient input for one pair', () => {
      const result = Trade.bestTradeExactIn(
        [pair_0_1, pair_0_2, pair_1_2],
        CurrencyAmount.fromRawAmount(token0, 1n),
        token2,
      );
      expect(result).toHaveLength(2);
      expect(result[1][0].route.pairs).toHaveLength(1); // 0 -> 2 at 10:11
      expect(result[1][0].route.path).toEqual([token0, token2]);
      expect(result[1][0].outputAmount).toEqual(CurrencyAmount.fromRawAmount(token2, 1n));
    });

    it('respects n', () => {
      const result = Trade.bestTradeExactIn(
        [pair_0_1, pair_0_2, pair_1_2],
        CurrencyAmount.fromRawAmount(token0, 10n),
        token2,
        { maxNumResults: 1 },
      );

      expect(result).toHaveLength(3);
    });

    it('no path', () => {
      const result = Trade.bestTradeExactIn(
        [pair_0_1, pair_0_3, pair_1_3],
        CurrencyAmount.fromRawAmount(token0, 10n),
        token2,
      );
      expect(result).toHaveLength(0);
    });

    it('works for ETHER currency input', () => {
      const result = Trade.bestTradeExactIn(
        [pair_weth_0, pair_0_1, pair_0_3, pair_1_3],
        CurrencyAmount.fromRawAmount(Ether.onChain(1), 100n),
        token3,
      );
      expect(result).toHaveLength(4);
      expect(result[3][0].inputAmount.currency).toEqual(ETHER);
      expect(result[3][0].route.path).toEqual([WETH9[1], token0, token1, token3]);
      expect(result[3][0].outputAmount.currency).toEqual(token3);
      expect(result[2][0].inputAmount.currency).toEqual(ETHER);
      expect(result[2][0].route.path).toEqual([WETH9[1], token0, token3]);
      expect(result[2][0].outputAmount.currency).toEqual(token3);
    });
    it('works for ETHER currency output', () => {
      const result = Trade.bestTradeExactIn(
        [pair_weth_0, pair_0_1, pair_0_3, pair_1_3],
        CurrencyAmount.fromRawAmount(token3, 100n),
        ETHER,
      );
      expect(result).toHaveLength(4);
      expect(result[2][0].inputAmount.currency).toEqual(token3);
      expect(result[2][0].route.path).toEqual([token3, token0, WETH9[1]]);
      expect(result[2][0].outputAmount.currency).toEqual(ETHER);
      expect(result[3][0].inputAmount.currency).toEqual(token3);
      expect(result[3][0].route.path).toEqual([token3, token1, token0, WETH9[1]]);
      expect(result[3][0].outputAmount.currency).toEqual(ETHER);
    });
  });

  describe('#maximumAmountIn', () => {
    describe('tradeType = EXACT_INPUT', () => {
      const exactIn = new Trade(
        new Route([pair_0_1, pair_1_2], token0, token2),
        CurrencyAmount.fromRawAmount(token0, 100n),
        TradeType.EXACT_INPUT,
      );
      it('throws if less than 0', () => {
        expect(() => exactIn.maximumAmountIn(new Percent(-1n, 100n))).toThrow('SLIPPAGE_TOLERANCE');
      });
      it('returns exact if 0', () => {
        expect(exactIn.maximumAmountIn(new Percent(0n, 100n))).toEqual(exactIn.inputAmount);
      });
      it('returns exact if nonzero', () => {
        expect(exactIn.maximumAmountIn(new Percent(0n, 100n))).toEqual(CurrencyAmount.fromRawAmount(token0, 100n));
        expect(exactIn.maximumAmountIn(new Percent(5n, 100n))).toEqual(CurrencyAmount.fromRawAmount(token0, 100n));
        expect(exactIn.maximumAmountIn(new Percent(200n, 100n))).toEqual(CurrencyAmount.fromRawAmount(token0, 100n));
      });
    });
    describe('tradeType = EXACT_OUTPUT', () => {
      const exactOut = new Trade(
        new Route([pair_0_1, pair_1_2], token0, token2),
        CurrencyAmount.fromRawAmount(token2, 100n),
        TradeType.EXACT_OUTPUT,
      );

      it('throws if less than 0', () => {
        expect(() => exactOut.maximumAmountIn(new Percent(-1n, 100n))).toThrow('SLIPPAGE_TOLERANCE');
      });
      it('returns exact if 0', () => {
        expect(exactOut.maximumAmountIn(new Percent(0n, 100n))).toEqual(exactOut.inputAmount);
      });
      it('returns slippage amount if nonzero', () => {
        expect(exactOut.maximumAmountIn(new Percent(0n, 100n))).toEqual(CurrencyAmount.fromRawAmount(token0, 156n));
        expect(exactOut.maximumAmountIn(new Percent(5n, 100n))).toEqual(CurrencyAmount.fromRawAmount(token0, 163n));
        expect(exactOut.maximumAmountIn(new Percent(200n, 100n))).toEqual(CurrencyAmount.fromRawAmount(token0, 468n));
      });
    });
  });

  describe('#minimumAmountOut', () => {
    describe('tradeType = EXACT_INPUT', () => {
      const exactIn = new Trade(
        new Route([pair_0_1, pair_1_2], token0, token2),
        CurrencyAmount.fromRawAmount(token0, 100n),
        TradeType.EXACT_INPUT,
      );
      it('throws if less than 0', () => {
        expect(() => exactIn.minimumAmountOut(new Percent(-1n, 100n))).toThrow('SLIPPAGE_TOLERANCE');
      });
      it('returns exact if 0', () => {
        expect(exactIn.minimumAmountOut(new Percent(0n, 100n))).toEqual(exactIn.outputAmount);
      });
      it('returns exact if nonzero', () => {
        expect(exactIn.minimumAmountOut(new Percent(0n, 100n))).toEqual(CurrencyAmount.fromRawAmount(token2, 69n));
        expect(exactIn.minimumAmountOut(new Percent(5n, 100n))).toEqual(CurrencyAmount.fromRawAmount(token2, 65n));
        expect(exactIn.minimumAmountOut(new Percent(200n, 100n))).toEqual(CurrencyAmount.fromRawAmount(token2, 23n));
      });
    });
    describe('tradeType = EXACT_OUTPUT', () => {
      const exactOut = new Trade(
        new Route([pair_0_1, pair_1_2], token0, token2),
        CurrencyAmount.fromRawAmount(token2, 100n),
        TradeType.EXACT_OUTPUT,
      );

      it('throws if less than 0', () => {
        expect(() => exactOut.minimumAmountOut(new Percent(-1n, 100n))).toThrow('SLIPPAGE_TOLERANCE');
      });
      it('returns exact if 0', () => {
        expect(exactOut.minimumAmountOut(new Percent(0n, 100n))).toEqual(exactOut.outputAmount);
      });
      it('returns slippage amount if nonzero', () => {
        expect(exactOut.minimumAmountOut(new Percent(0n, 100n))).toEqual(CurrencyAmount.fromRawAmount(token2, 100n));
        expect(exactOut.minimumAmountOut(new Percent(5n, 100n))).toEqual(CurrencyAmount.fromRawAmount(token2, 100n));
        expect(exactOut.minimumAmountOut(new Percent(200n, 100n))).toEqual(CurrencyAmount.fromRawAmount(token2, 100n));
      });
    });
  });

  describe('#worstExecutionPrice', () => {
    describe('tradeType = EXACT_INPUT', () => {
      const exactIn = new Trade(
        new Route([pair_0_1, pair_1_2], token0, token2),
        CurrencyAmount.fromRawAmount(token0, 100),
        TradeType.EXACT_INPUT,
      );
      it('throws if less than 0', () => {
        expect(() => exactIn.minimumAmountOut(new Percent(-1, 100))).toThrow('SLIPPAGE_TOLERANCE');
      });
      it('returns exact if 0', () => {
        expect(exactIn.worstExecutionPrice(new Percent(0, 100))).toEqual(exactIn.executionPrice);
      });
      it('returns exact if nonzero', () => {
        expect(exactIn.worstExecutionPrice(new Percent(0, 100))).toEqual(new Price(token0, token2, 100, 69));
        expect(exactIn.worstExecutionPrice(new Percent(5, 100))).toEqual(new Price(token0, token2, 100, 65));
        expect(exactIn.worstExecutionPrice(new Percent(200, 100))).toEqual(new Price(token0, token2, 100, 23));
      });
    });
    describe('tradeType = EXACT_OUTPUT', () => {
      const exactOut = new Trade(
        new Route([pair_0_1, pair_1_2], token0, token2),
        CurrencyAmount.fromRawAmount(token2, 100),
        TradeType.EXACT_OUTPUT,
      );

      it('throws if less than 0', () => {
        expect(() => exactOut.worstExecutionPrice(new Percent(-1, 100))).toThrow('SLIPPAGE_TOLERANCE');
      });
      it('returns exact if 0', () => {
        expect(exactOut.worstExecutionPrice(new Percent(0, 100))).toEqual(exactOut.executionPrice);
      });
      it('returns slippage amount if nonzero', () => {
        expect(exactOut.worstExecutionPrice(new Percent(0, 100))).toEqual(new Price(token0, token2, 156, 100));
        expect(exactOut.worstExecutionPrice(new Percent(5, 100))).toEqual(new Price(token0, token2, 163, 100));
        expect(exactOut.worstExecutionPrice(new Percent(200, 100))).toEqual(new Price(token0, token2, 468, 100));
      });
    });
  });

  describe('#bestTradeExactOut', () => {
    it('throws with empty pairs', () => {
      expect(() => Trade.bestTradeExactOut([], token0, CurrencyAmount.fromRawAmount(token2, 100n))).toThrow('PAIRS');
    });
    it('throws with max hops of 0', () => {
      expect(() =>
        Trade.bestTradeExactOut([pair_0_2], token0, CurrencyAmount.fromRawAmount(token2, 100n), {
          maxHops: 0,
        }),
      ).toThrow('MAX_HOPS');
    });

    it('provides best route', () => {
      const result = Trade.bestTradeExactOut(
        [pair_0_1, pair_0_2, pair_1_2],
        token0,
        CurrencyAmount.fromRawAmount(token2, 100n),
      );
      expect(result).toHaveLength(3);
      expect(result[1][0].route.pairs).toHaveLength(1); // 0 -> 2 at 10:11
      expect(result[1][0].route.path).toEqual([token0, token2]);
      expect(result[1][0].inputAmount).toEqual(CurrencyAmount.fromRawAmount(token0, 101n));
      expect(result[1][0].outputAmount).toEqual(CurrencyAmount.fromRawAmount(token2, 100n));
      expect(result[2][0].route.pairs).toHaveLength(2); // 0 -> 1 -> 2 at 12:12:10
      expect(result[2][0].route.path).toEqual([token0, token1, token2]);
      expect(result[2][0].inputAmount).toEqual(CurrencyAmount.fromRawAmount(token0, 156n));
      expect(result[2][0].outputAmount).toEqual(CurrencyAmount.fromRawAmount(token2, 100n));
    });

    it('doesnt throw for zero liquidity pairs', () => {
      expect(
        Trade.bestTradeExactOut([empty_pair_0_1], token1, CurrencyAmount.fromRawAmount(token1, 100n)),
      ).toHaveLength(0);
    });

    it('respects maxHops', () => {
      const result = Trade.bestTradeExactOut(
        [pair_0_1, pair_0_2, pair_1_2],
        token0,
        CurrencyAmount.fromRawAmount(token2, 10n),
        { maxHops: 1 },
      );
      expect(result).toHaveLength(2);
      expect(result[1][0].route.pairs).toHaveLength(1); // 0 -> 2 at 10:11
      expect(result[1][0].route.path).toEqual([token0, token2]);
    });

    it('insufficient liquidity', () => {
      const result = Trade.bestTradeExactOut(
        [pair_0_1, pair_0_2, pair_1_2],
        token0,
        CurrencyAmount.fromRawAmount(token2, 1200n),
      );
      expect(result).toHaveLength(0);
    });

    it('insufficient liquidity in one pair but not the other', () => {
      const result = Trade.bestTradeExactOut(
        [pair_0_1, pair_0_2, pair_1_2],
        token0,
        CurrencyAmount.fromRawAmount(token2, 1050n),
      );
      expect(result).toHaveLength(2);
    });

    it('respects n', () => {
      const result = Trade.bestTradeExactOut(
        [pair_0_1, pair_0_2, pair_1_2],
        token0,
        CurrencyAmount.fromRawAmount(token2, 10n),
        { maxNumResults: 1 },
      );

      expect(result).toHaveLength(3);
    });

    it('no path', () => {
      const result = Trade.bestTradeExactOut(
        [pair_0_1, pair_0_3, pair_1_3],
        token0,
        CurrencyAmount.fromRawAmount(token2, 10n),
      );
      expect(result).toHaveLength(0);
    });

    it('works for ETHER currency input', () => {
      const result = Trade.bestTradeExactOut(
        [pair_weth_0, pair_0_1, pair_0_3, pair_1_3],
        ETHER,
        CurrencyAmount.fromRawAmount(token3, 100n),
      );
      expect(result).toHaveLength(4);
      expect(result[3][0].inputAmount.currency).toEqual(ETHER);
      expect(result[3][0].route.path).toEqual([WETH9[1], token0, token1, token3]);
      expect(result[3][0].outputAmount.currency).toEqual(token3);
      expect(result[2][0].inputAmount.currency).toEqual(ETHER);
      expect(result[2][0].route.path).toEqual([WETH9[1], token0, token3]);
      expect(result[2][0].outputAmount.currency).toEqual(token3);
    });
    it('works for ETHER currency output', () => {
      const result = Trade.bestTradeExactOut(
        [pair_weth_0, pair_0_1, pair_0_3, pair_1_3],
        token3,
        CurrencyAmount.fromRawAmount(Ether.onChain(1), 100n),
      );
      expect(result).toHaveLength(4);
      expect(result[2][0].inputAmount.currency).toEqual(token3);
      expect(result[2][0].route.path).toEqual([token3, token0, WETH9[1]]);
      expect(result[2][0].outputAmount.currency).toEqual(ETHER);
      expect(result[3][0].inputAmount.currency).toEqual(token3);
      expect(result[3][0].route.path).toEqual([token3, token1, token0, WETH9[1]]);
      expect(result[3][0].outputAmount.currency).toEqual(ETHER);
    });
  });
});
