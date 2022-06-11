import React, { useMemo } from 'react';

import { t, Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import JSBI from 'jsbi';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import { useMedia } from 'react-use';
import { Flex, Box } from 'rebass/styled-components';

import { Typography } from 'app/theme';
import { FRACTION_ZERO } from 'constants/misc';
import { usePoolData } from 'hooks/usePools';
import { PairState } from 'hooks/useV2Pairs';
import { useAllPairsAPY } from 'queries/reward';
import { Field } from 'store/mint/actions';
import { useDerivedMintInfo } from 'store/mint/hooks';
import { useReward } from 'store/reward/hooks';
import { useStakedLPPercent } from 'store/stakedLP/hooks';
import { useLiquidityTokenBalance } from 'store/wallet/hooks';
import { formatBigNumber } from 'utils';

import { stakedFraction } from './utils';

export default function LPDescription() {
  const { currencies, pair, pairState } = useDerivedMintInfo();
  const { account } = useIconReact();
  const upSmall = useMedia('(min-width: 600px)');
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

  const stakedLPPercent = useStakedLPPercent(pair?.poolId ?? -1);
  const stakedFractionValue = stakedFraction(stakedLPPercent);
  const poolData = usePoolData(pair?.poolId ?? -1);

  return (
    <>
      {pairState === PairState.NOT_EXISTS && (
        <Flex bg="bg2" flex={1} padding={[5, 7]} flexDirection="column">
          <Typography variant="h3" mb={2} marginBottom={40}>
            {`${currencies[Field.CURRENCY_A]?.symbol} / ${currencies[Field.CURRENCY_B]?.symbol}`}{' '}
            <Trans>liquidity pool</Trans>
          </Typography>

          <Flex flex={1} alignItems="center" justifyContent="center">
            <Typography textAlign="center">
              <Trans>There's no liquidity pool for this pair yet.</Trans>
              <br />
              <Trans>Supply liquidity for these assets in any quantity to create a new pool.</Trans>
            </Typography>
          </Flex>
        </Flex>
      )}

      {pairState === PairState.EXISTS && (
        <Box bg="bg2" flex={1} padding={[5, 7]}>
          {poolRewards ? (
            <Typography variant="h3" mb={2} marginBottom={40}>
              {pair?.poolId !== BalancedJs.utils.POOL_IDS.sICXICX
                ? t`${currencies[Field.CURRENCY_A]?.symbol} / ${currencies[Field.CURRENCY_B]?.symbol}
                    liquidity pool${upSmall ? ': ' : ''}`
                : t`${currencies[Field.CURRENCY_A]?.symbol} liquidity pool${upSmall ? ': ' : ''}`}{' '}
              <Typography fontWeight="normal" fontSize={16} as={upSmall ? 'span' : 'p'}>
                {apy?.times(100).dp(2).toFixed() ?? '-'}% APY
              </Typography>
            </Typography>
          ) : (
            <Typography variant="h3" mb={2} marginBottom={40}>
              {pair?.poolId !== BalancedJs.utils.POOL_IDS.sICXICX
                ? t`${currencies[Field.CURRENCY_A]?.symbol} / ${currencies[Field.CURRENCY_B]?.symbol} liquidity pool`
                : t`${currencies[Field.CURRENCY_A]?.symbol} liquidity pool`}
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
                    <Trans>Sign in to view your liquidity details.</Trans>
                  </Typography>
                </Flex>
              )}

              {pair && account && (
                <>
                  <Box sx={{ margin: '15px 0 25px 0' }}>
                    <Typography textAlign="center" marginBottom="5px" color="text1">
                      <Trans>Your supply</Trans>
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
                        <Trans>Your daily rewards </Trans>
                      </Typography>
                      {pair.poolId === BalancedJs.utils.POOL_IDS.sICXICX ? (
                        <Typography textAlign="center" variant="p">
                          {userRewards?.isEqualTo(0) ? 'N/A' : userRewards ? `~ ${userRewards.toFixed(2)} BALN` : 'N/A'}
                        </Typography>
                      ) : (
                        <Typography textAlign="center" variant="p">
                          {poolData?.suppliedReward?.equalTo(FRACTION_ZERO)
                            ? 'N/A'
                            : poolData?.suppliedReward?.multiply(stakedFractionValue)
                            ? `~ ${poolData?.suppliedReward
                                ?.multiply(stakedFractionValue)
                                .divide(100)
                                .toFixed(2, { groupSeparator: ',' })} BALN`
                            : 'N/A'}
                        </Typography>
                      )}
                    </Box>
                  )}
                </>
              )}
            </Box>

            <Box width={[1, 1 / 2]}>
              <Box sx={{ margin: '15px 0 25px 0' }}>
                <Typography textAlign="center" marginBottom="5px" color="text1">
                  <Trans>Total supply</Trans>
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
                    <Trans>Total daily rewards</Trans>
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
