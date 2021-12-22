import React from 'react';

import JSBI from 'jsbi';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import { Flex, Box } from 'rebass/styled-components';

import { Typography } from 'app/theme';
import { PairState } from 'hooks/useV2Pairs';
import { Field } from 'store/mint/actions';
import { useDerivedMintInfo } from 'store/mint/hooks';
import { useBalance, usePoolData } from 'store/pool/hooks';

export default function LPDescription() {
  const { currencies, pair, pairState } = useDerivedMintInfo();
  const { account } = useIconReact();
  const balance = useBalance(pair?.poolId ?? -1);
  const poolData = usePoolData(pair?.poolId ?? -1);
  const userPoolBalance = balance?.balance;
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

  const poolRewards = poolData?.totalReward;
  const userRewards = poolData?.suppliedReward;
  return (
    <>
      {pairState === PairState.NOT_EXISTS && (
        <Flex bg="bg2" flex={1} padding={[5, 7]} flexDirection="column">
          <Typography variant="h3" mb={2}>
            {`${currencies[Field.CURRENCY_A]?.symbol} / ${currencies[Field.CURRENCY_B]?.symbol}`} liquidity pool
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
          <Typography variant="h3" mb={2}>
            {pair?.poolId !== BalancedJs.utils.POOL_IDS.sICXICX
              ? `${currencies[Field.CURRENCY_A]?.symbol} / ${currencies[Field.CURRENCY_B]?.symbol} liquidity pool`
              : `${currencies[Field.CURRENCY_A]?.symbol} liquidity pool`}
          </Typography>

          <Flex flexWrap="wrap">
            <Box
              width={[1, 1 / 2]} //
              sx={{
                borderBottom: ['1px solid rgba(255, 255, 255, 0.15)', 0], //
                borderRight: [0, '1px solid rgba(255, 255, 255, 0.15)'],
              }}
            >
              <Box sx={{ margin: '15px 0 25px 0' }}>
                <Typography textAlign="center" marginBottom="5px" color="text1">
                  Your supply
                </Typography>
                {pair && account && (
                  <Typography textAlign="center" variant="p">
                    {pair?.poolId !== BalancedJs.utils.POOL_IDS.sICXICX ? (
                      <>
                        {token0Deposited?.toSignificant(6, { groupSeparator: ',' })} {pair?.reserve0.currency?.symbol}
                        <br />
                        {token1Deposited?.toSignificant(6, { groupSeparator: ',' })} {pair?.reserve1.currency?.symbol}
                      </>
                    ) : (
                      `${token0Deposited?.toSignificant(6, { groupSeparator: ',' })} ${pair?.reserve0.currency?.symbol}`
                    )}
                  </Typography>
                )}
              </Box>

              {userRewards && (
                <Box sx={{ margin: '15px 0 25px 0' }}>
                  <Typography textAlign="center" marginBottom="5px" color="text1">
                    Your daily rewards
                  </Typography>
                  <Typography textAlign="center" variant="p">
                    ~ {userRewards.toFixed(2, { groupSeparator: ',' })} BALN
                  </Typography>
                </Box>
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
                    {poolRewards.toFixed(2, { groupSeparator: ',' })} BALN
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
