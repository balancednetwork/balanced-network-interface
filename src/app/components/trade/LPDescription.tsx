import React, { useMemo } from 'react';

import BigNumber from 'bignumber.js';
import JSBI from 'jsbi';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import { isMobile } from 'react-device-detect';
import { Flex, Box } from 'rebass/styled-components';

import Spinner from 'app/components/Spinner';
import { Typography } from 'app/theme';
import { PairState } from 'hooks/useV2Pairs';
import { useAllPairsAPY } from 'queries/reward';
import { Field } from 'store/mint/actions';
import { useDerivedMintInfo } from 'store/mint/hooks';
import { useReward } from 'store/reward/hooks';
import { useLiquidityTokenBalance } from 'store/wallet/hooks';
import { formatBigNumber } from 'utils';

export default function LPDescription() {
  const { currencies, pair, pairState } = useDerivedMintInfo();
  const { account } = useIconReact();
  const userPoolBalance = useLiquidityTokenBalance(account, pair);
  const totalPoolTokens = pair?.totalSupply;
  const [token0Deposited, token1Deposited] =
    !!pair &&
    !!totalPoolTokens &&
    !!userPoolBalance &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    JSBI.greaterThanOrEqual(totalPoolTokens.quotient, userPoolBalance.quotient)
      ? [
          pair.getLiquidityValue(pair.token0, totalPoolTokens, userPoolBalance, false),
          pair.getLiquidityValue(pair.token1, totalPoolTokens, userPoolBalance, false),
        ]
      : [undefined, undefined];

  const poolRewards = useReward(pair?.poolId ?? -1);
  const userRewards = useMemo(() => {
    return !!pair && !!totalPoolTokens && !!userPoolBalance && !!poolRewards
      ? poolRewards.times(new BigNumber(userPoolBalance.toFixed()).div(new BigNumber(totalPoolTokens.toFixed())))
      : undefined;
  }, [pair, totalPoolTokens, userPoolBalance, poolRewards]);

  const apys = useAllPairsAPY();
  const apy = apys && apys[pair?.poolId ?? -1];
  return (
    <>
      {pairState === PairState.LOADING && (
        <Flex justifyContent="center" alignItems="center" flex="1" padding={isMobile ? '25px' : '0px'}>
          <Spinner size={'lg'} />
        </Flex>
      )}
      {pairState === PairState.NOT_EXISTS && (
        <Flex bg="bg2" flex={1} padding={[5, 7]} flexDirection="column">
          <Typography variant="h3" mb={2}>
            {`${currencies[Field.CURRENCY_A]?.symbol} / ${currencies[Field.CURRENCY_B]?.symbol}`} liquidity pool{' '}
          </Typography>

          <Flex flex={1} alignItems="center" justifyContent="center">
            <Typography textAlign="center">
              There's no liquidity pool for this pair yet. <br />
              Supply liquidity for these assets in any quantity to create a new pool.
            </Typography>
          </Flex>
        </Flex>
      )}

      {pairState === PairState.EXISTS && (
        <Box bg="bg2" flex={1} padding={[5, 7]}>
          {poolRewards ? (
            <Typography variant="h3" mb={2}>
              {pair?.poolId !== BalancedJs.utils.POOL_IDS.sICXICX
                ? `${currencies[Field.CURRENCY_A]?.symbol} / ${currencies[Field.CURRENCY_B]?.symbol} liquidity pool:`
                : `${currencies[Field.CURRENCY_A]?.symbol} liquidity pool:`}{' '}
              <Typography fontWeight="normal" fontSize={16} as="span">
                {apy?.times(100).dp(2).toFixed() ?? '-'}% APY
              </Typography>
            </Typography>
          ) : (
            <Typography variant="h3" mb={2}>
              {pair?.poolId !== BalancedJs.utils.POOL_IDS.sICXICX
                ? `${currencies[Field.CURRENCY_A]?.symbol} / ${currencies[Field.CURRENCY_B]?.symbol} liquidity pool`
                : `${currencies[Field.CURRENCY_A]?.symbol} liquidity pool`}{' '}
            </Typography>
          )}

          <Flex flexWrap="wrap">
            <Box
              width={[1, 1 / 2]} //
              sx={{
                borderBottom: ['1px solid rgba(255, 255, 255, 0.15)', 0], //
                borderRight: [0, '1px solid rgba(255, 255, 255, 0.15)'],
              }}
            >
              {pair && !account && (
                <Flex alignItems="center" justifyContent="center" height="100%">
                  <Typography textAlign="center" marginBottom="5px" color="text1">
                    Sign in to view your liquidity details.
                  </Typography>
                </Flex>
              )}

              {pair && account && !userPoolBalance && (
                <Flex justifyContent="center" alignItems="center" height="100%" padding={isMobile ? '25px' : '0px'}>
                  <Spinner size={'lg'} />
                </Flex>
              )}
              {pair && account && userPoolBalance && (
                <>
                  <Box sx={{ margin: '15px 0 25px 0' }}>
                    <Typography textAlign="center" marginBottom="5px" color="text1">
                      Your supply
                    </Typography>

                    <Typography textAlign="center" variant="p">
                      {pair?.poolId !== BalancedJs.utils.POOL_IDS.sICXICX ? (
                        <>
                          {token0Deposited?.toSignificant(6, { groupSeparator: ',' })} {pair?.reserve0.currency?.symbol}
                          <br />
                          {token1Deposited?.toSignificant(6, { groupSeparator: ',' })} {pair?.reserve1.currency?.symbol}
                        </>
                      ) : (
                        `${token0Deposited?.toSignificant(6, { groupSeparator: ',' })} ${
                          pair?.reserve0.currency?.symbol
                        }`
                      )}
                    </Typography>
                  </Box>

                  {userRewards && (
                    <Box sx={{ margin: '15px 0 25px 0' }}>
                      <Typography textAlign="center" marginBottom="5px" color="text1">
                        Your daily rewards
                      </Typography>
                      <Typography textAlign="center" variant="p">
                        ~ {formatBigNumber(userRewards, 'currency')} BALN
                      </Typography>
                    </Box>
                  )}
                </>
              )}
            </Box>

            <Box width={[1, 1 / 2]}>
              <Box sx={{ margin: '15px 0 25px 0' }}>
                <Typography textAlign="center" marginBottom="5px" color="text1">
                  Total supply
                </Typography>
                {pair && (
                  <Typography textAlign="center" variant="p">
                    {pair?.poolId !== BalancedJs.utils.POOL_IDS.sICXICX ? (
                      <>
                        {pair?.reserve0.toFixed(0, { groupSeparator: ',' })} {pair?.reserve0.currency?.symbol}
                        <br />
                        {pair?.reserve1.toFixed(0, { groupSeparator: ',' })} {pair?.reserve1.currency?.symbol}
                      </>
                    ) : (
                      `${pair?.reserve0.toFixed(0, { groupSeparator: ',' })} ${pair?.reserve0.currency?.symbol}`
                    )}
                  </Typography>
                )}
              </Box>

              {poolRewards && (
                <Box sx={{ margin: '15px 0 25px 0' }}>
                  <Typography textAlign="center" marginBottom="5px" color="text1">
                    Total daily rewards
                  </Typography>
                  <Typography textAlign="center" variant="p">
                    {formatBigNumber(poolRewards, 'currency')} BALN
                  </Typography>
                </Box>
              )}
            </Box>
          </Flex>
        </Box>
      )}
    </>
  );
}
