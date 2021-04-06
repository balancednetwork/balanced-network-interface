import React, { useCallback, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';
import { convertLoopToIcx } from 'packages/icon-react/utils';
import { useDispatch, useSelector } from 'react-redux';

import bnJs from 'bnJs';
import { useAllTransactions } from 'store/transactions/hooks';

import { AppState } from '..';
import { changeLiquiditySupply } from './actions';
import { LiquidityState } from './reducer';

// #redux-step-5: define function get value of variable from store
export function useLiquiditySupply(): AppState['liquidity'] {
  const liquidity = useSelector((state: AppState) => state.liquidity);
  return useMemo(() => liquidity, [liquidity]);
}

// #redux-step-6: define function working with variable on store
export function useChangeLiquiditySupply(): ({
  sICXPoolsICXbnUSDTotal,
  bnUSDPoolsICXbnUSDTotal,
  sICXbnUSDBalance,
  sICXbnUSDTotalSupply,

  BALNPoolBALNbnUSDTotal,
  bnUSDPoolBALNbnUSDTotal,
  BALNbnUSDBalance,
  BALNbnUSDTotalSupply,

  sICXSuppliedPoolsICXbnUSD,
  bnUSDSuppliedPoolsICXbnUSD,

  BALNSuppliedPoolBALNbnUSD,
  bnUSDSuppliedPoolBALNbnUSD,

  sICXICXTotalSupply,
  ICXBalance,
}: LiquidityState) => void {
  const dispatch = useDispatch();
  return useCallback(
    ({
      sICXPoolsICXbnUSDTotal,
      bnUSDPoolsICXbnUSDTotal,
      sICXbnUSDBalance,
      sICXbnUSDTotalSupply,

      BALNPoolBALNbnUSDTotal,
      bnUSDPoolBALNbnUSDTotal,
      BALNbnUSDBalance,
      BALNbnUSDTotalSupply,

      sICXSuppliedPoolsICXbnUSD,
      bnUSDSuppliedPoolsICXbnUSD,

      BALNSuppliedPoolBALNbnUSD,
      bnUSDSuppliedPoolBALNbnUSD,

      sICXICXTotalSupply,
      ICXBalance,
    }) => {
      dispatch(
        changeLiquiditySupply({
          sICXPoolsICXbnUSDTotal,
          bnUSDPoolsICXbnUSDTotal,
          sICXbnUSDBalance,
          sICXbnUSDTotalSupply,

          BALNPoolBALNbnUSDTotal,
          bnUSDPoolBALNbnUSDTotal,
          BALNbnUSDBalance,
          BALNbnUSDTotalSupply,

          sICXSuppliedPoolsICXbnUSD,
          bnUSDSuppliedPoolsICXbnUSD,

          BALNSuppliedPoolBALNbnUSD,
          bnUSDSuppliedPoolBALNbnUSD,

          sICXICXTotalSupply,
          ICXBalance,
        }),
      );
    },
    [dispatch],
  );
}

export function useFetchLiquidity(account?: string | null) {
  // eject this account and we don't need to account params for when call contract
  bnJs.eject({ account });
  const transactions = useAllTransactions();
  const changeLiquiditySupply = useChangeLiquiditySupply();

  const calculateTokenSupplied = (balance: BigNumber, poolSupply: BigNumber, poolTotal: BigNumber) => {
    let poolFraction = balance.dividedBy(poolSupply);
    let tokenSupplied = poolFraction.multipliedBy(poolTotal);
    if (tokenSupplied.isNaN()) tokenSupplied = new BigNumber(0);
    return tokenSupplied;
  };

  const fetchLiquidity = React.useCallback(() => {
    const getSuppliedToken = (poolId: string, baseAddress: string, quoteAddress: string) => {
      return new Promise((resolve, reject) => {
        Promise.all([
          bnJs.Dex.balanceOf(poolId),
          bnJs.Dex.getTotalSupply(poolId),
          bnJs.Dex.getPoolTotal(poolId, baseAddress),
          bnJs.Dex.getPoolTotal(poolId, quoteAddress),
        ])
          .then(result => {
            const [balance, poolTotalSupply, poolBaseTotal, poolQuoteTotal] = result.map(v =>
              convertLoopToIcx(v as BigNumber),
            );
            const baseTokenSupplied = calculateTokenSupplied(balance, poolTotalSupply, poolBaseTotal);
            const quoteTokenSupplied = calculateTokenSupplied(balance, poolTotalSupply, poolQuoteTotal);
            resolve({ balance, baseTokenSupplied, quoteTokenSupplied, poolBaseTotal, poolQuoteTotal, poolTotalSupply });
          })
          .catch(reject);
      });
    };

    if (account) {
      Promise.all([
        bnJs.Dex.getTotalSupply(BalancedJs.utils.sICXICXpoolId.toString()),
        bnJs.eject({ account: account }).Dex.getICXBalance(),
      ]).then(result => {
        const [sICXICXTotalSupply, ICXBalance] = result.map(v => convertLoopToIcx(v as BigNumber));

        changeLiquiditySupply({
          sICXICXTotalSupply,
          ICXBalance,
        });
      });

      getSuppliedToken(BalancedJs.utils.sICXbnUSDpoolId.toString(), bnJs.sICX.address, bnJs.bnUSD.address)
        .then((result: any) =>
          changeLiquiditySupply({
            sICXbnUSDBalance: result.balance,
            sICXSuppliedPoolsICXbnUSD: result.baseTokenSupplied,
            bnUSDSuppliedPoolsICXbnUSD: result.quoteTokenSupplied,
            sICXPoolsICXbnUSDTotal: result.poolBaseTotal,
            bnUSDPoolsICXbnUSDTotal: result.poolQuoteTotal,
            sICXbnUSDTotalSupply: result.poolTotalSupply,
          }),
        )
        .catch(e => console.error(e));

      getSuppliedToken(BalancedJs.utils.BALNbnUSDpoolId.toString(), bnJs.Baln.address, bnJs.bnUSD.address)
        .then((result: any) =>
          changeLiquiditySupply({
            BALNbnUSDBalance: result.balance,
            BALNSuppliedPoolBALNbnUSD: result.baseTokenSupplied,
            bnUSDSuppliedPoolBALNbnUSD: result.quoteTokenSupplied,
            BALNPoolBALNbnUSDTotal: result.poolBaseTotal,
            bnUSDPoolBALNbnUSDTotal: result.poolQuoteTotal,
            BALNbnUSDTotalSupply: result.poolTotalSupply,
          }),
        )
        .catch(e => console.error(e));
    }
  }, [account, changeLiquiditySupply]);

  /*const fetchLiquidity = React.useCallback(() => {
    if (account) {
      Promise.all([
        bnJs.Dex.getPoolTotal(BalancedJs.utils.sICXbnUSDpoolId.toString(), bnJs.sICX.address),
        bnJs.Dex.getPoolTotal(BalancedJs.utils.sICXbnUSDpoolId.toString(), bnJs.bnUSD.address),
        bnJs.Dex.balanceOf(BalancedJs.utils.sICXbnUSDpoolId.toString()),
        bnJs.Dex.getTotalSupply(BalancedJs.utils.sICXbnUSDpoolId.toString()),

        bnJs.Dex.getPoolTotal(BalancedJs.utils.BALNbnUSDpoolId.toString(), bnJs.Baln.address),
        bnJs.Dex.getPoolTotal(BalancedJs.utils.BALNbnUSDpoolId.toString(), bnJs.bnUSD.address),
        bnJs.Dex.balanceOf(BalancedJs.utils.BALNbnUSDpoolId.toString()),
        bnJs.Dex.getTotalSupply(BalancedJs.utils.BALNbnUSDpoolId.toString()),

        bnJs.Dex.getTotalSupply(BalancedJs.utils.sICXICXpoolId.toString()),
        bnJs.eject({ account: account }).Dex.getICXBalance(),
      ]).then(result => {
        const [
          sICXPoolsICXbnUSDTotal, // sm method `getPoolTotal`
          bnUSDPoolsICXbnUSDTotal, // sm method `getPoolTotal`
          sICXbnUSDBalance, // sm method `balanceOf`
          sICXbnUSDTotalSupply, // sm method `totalSupply` pool sICXbnUSDpoolId

          BALNPoolBALNbnUSDTotal,
          bnUSDPoolBALNbnUSDTotal,
          BALNbnUSDBalance,
          BALNbnUSDTotalSupply,

          sICXICXTotalSupply, // sm method `totalSupply` pool sICXICXpoolId
          ICXBalance,
        ] = result.map(v => convertLoopToIcx(v as BigNumber));
        const sICXSuppliedPoolsICXbnUSD = calculateTokenSupplied(
          sICXbnUSDBalance,
          sICXPoolsICXbnUSDTotal,
          sICXbnUSDTotalSupply,
        );
        const bnUSDSuppliedPoolsICXbnUSD = calculateTokenSupplied(
          sICXbnUSDBalance,
          bnUSDPoolsICXbnUSDTotal,
          sICXbnUSDTotalSupply,
        );

        const BALNSuppliedPoolBALNbnUSD = calculateTokenSupplied(
          BALNbnUSDBalance,
          BALNPoolBALNbnUSDTotal,
          BALNbnUSDTotalSupply,
        );
        const bnUSDSuppliedPoolBALNbnUSD = calculateTokenSupplied(
          BALNbnUSDBalance,
          bnUSDPoolBALNbnUSDTotal,
          BALNbnUSDTotalSupply,
        );

        changeLiquiditySupply({
          sICXPoolsICXbnUSDTotal,
          bnUSDPoolsICXbnUSDTotal,
          sICXbnUSDBalance,
          sICXbnUSDTotalSupply,

          BALNPoolBALNbnUSDTotal,
          bnUSDPoolBALNbnUSDTotal,
          BALNbnUSDBalance,
          BALNbnUSDTotalSupply,

          sICXSuppliedPoolsICXbnUSD,
          bnUSDSuppliedPoolsICXbnUSD,

          BALNSuppliedPoolBALNbnUSD,
          bnUSDSuppliedPoolBALNbnUSD,

          sICXICXTotalSupply,
          ICXBalance,
        });
      });
    }
  }, [account, changeLiquiditySupply]);*/

  React.useEffect(() => {
    fetchLiquidity();
  }, [fetchLiquidity, transactions, account]);
}
