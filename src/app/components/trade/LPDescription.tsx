import React, { useMemo } from 'react';

import { BalancedJs } from '@balancednetwork/balanced-js';
import { Currency, CurrencyAmount } from '@balancednetwork/sdk-core';
import { t, Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import JSBI from 'jsbi';
import { useIconReact } from 'packages/icon-react';
import { useMedia } from 'react-use';
import { Flex, Box } from 'rebass/styled-components';

import { Typography } from 'app/theme';
import { usePoolData } from 'hooks/usePools';
import { PairState } from 'hooks/useV2Pairs';
import { useAllPairsAPY } from 'queries/reward';
import { Field } from 'store/mint/actions';
import { useDerivedMintInfo, useMintState } from 'store/mint/hooks';
import { useReward } from 'store/reward/hooks';
import { useWithdrawnPercent } from 'store/stakedLP/hooks';
import { tryParseAmount } from 'store/swap/hooks';
import { useLiquidityTokenBalance } from 'store/wallet/hooks';
import { formatBigNumber } from 'utils';

export default function LPDescription() {
  const { currencies, pair, pairState, dependentField, noLiquidity, parsedAmounts } = useDerivedMintInfo();
  const { independentField, typedValue, otherTypedValue } = useMintState();

  const { account } = useIconReact();
  const upSmall = useMedia('(min-width: 600px)');
  const userPoolBalance = useLiquidityTokenBalance(account, pair);
  const totalPoolTokens = pair?.totalSupply;
  const token0Deposited =
    !!pair &&
    !!totalPoolTokens &&
    !!userPoolBalance &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    JSBI.greaterThanOrEqual(totalPoolTokens.quotient, userPoolBalance.quotient)
      ? pair.getLiquidityValue(pair.token0, totalPoolTokens, userPoolBalance, false)
      : undefined;

  const apys = useAllPairsAPY();
  const apy = apys && apys[pair?.poolId ?? -1];

  const poolData = usePoolData(pair?.poolId ?? -1);

  //calulate Your supply temporary value  and Your daily reward temporary value
  const formattedAmounts = {
    [independentField]: tryParseAmount(typedValue, currencies[independentField]),
    [dependentField]: noLiquidity
      ? tryParseAmount(otherTypedValue, currencies[dependentField])
      : parsedAmounts[dependentField],
  };

  const poolRewards = useReward(pair?.poolId ?? -1);
  const tempTotalPoolTokens = new BigNumber(totalPoolTokens?.toFixed() || 0).plus(
    formattedAmounts[Field.CURRENCY_A]?.toFixed() || 0,
  );
  const userRewards = useMemo(() => {
    return !!pair && !!totalPoolTokens && !!poolRewards && !!userPoolBalance
      ? poolRewards.times(
          new BigNumber(userPoolBalance.toFixed())
            .plus(formattedAmounts[Field.CURRENCY_A]?.toFixed() || 0)
            .div(tempTotalPoolTokens),
        )
      : undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pair, totalPoolTokens, userPoolBalance, poolRewards, formattedAmounts[Field.CURRENCY_A]?.toFixed()]);

  const { baseValue, quoteValue } = useWithdrawnPercent(pair?.poolId ?? -1) || {};

  const totalSupply = (stakedValue: CurrencyAmount<Currency>, suppliedValue?: CurrencyAmount<Currency>) =>
    !!stakedValue ? suppliedValue?.subtract(stakedValue) : suppliedValue;

  const baseCurrencyTotalSupply = new BigNumber(totalSupply(baseValue, poolData?.suppliedBase)?.toFixed() || '0');
  const quoteCurrencyTotalSupply = new BigNumber(totalSupply(quoteValue, poolData?.suppliedQuote)?.toFixed() || '0');

  const tempTotalSupplyValue = new BigNumber(pair?.reserve0.toFixed() || 0).plus(
    new BigNumber(formattedAmounts[Field.CURRENCY_A]?.toFixed() || 0),
  );

  const suppliedReward = useMemo(
    () =>
      poolRewards
        ?.times(new BigNumber(formattedAmounts[Field.CURRENCY_A]?.toFixed() || 0).plus(baseCurrencyTotalSupply))
        .div(tempTotalSupplyValue.isZero() ? 1 : tempTotalSupplyValue),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [baseCurrencyTotalSupply, formattedAmounts[Field.CURRENCY_A]?.toFixed(), poolRewards],
  );

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
                          {formattedAmounts[Field.CURRENCY_A]
                            ? new BigNumber(baseCurrencyTotalSupply)
                                .plus(formattedAmounts[Field.CURRENCY_A]?.toFixed() || 0)
                                .dp(6)
                                .toFormat() || '...'
                            : baseCurrencyTotalSupply?.dp(6).toFormat(2) || '...'}{' '}
                          {pair?.reserve0.currency?.symbol}
                          <br />
                          {formattedAmounts[Field.CURRENCY_B]
                            ? new BigNumber(quoteCurrencyTotalSupply)
                                .plus(formattedAmounts[Field.CURRENCY_B]?.toFixed() || 0)
                                .dp(6)
                                .toFormat() || '...'
                            : quoteCurrencyTotalSupply?.dp(6).toFormat(2) || '...'}{' '}
                          {pair?.reserve1.currency?.symbol}
                        </>
                      ) : (
                        `${
                          formattedAmounts[Field.CURRENCY_A]
                            ? new BigNumber(token0Deposited?.toFixed() || 0)
                                .plus(formattedAmounts[Field.CURRENCY_A]?.toFixed() || 0)
                                .toFixed()
                            : token0Deposited?.toSignificant(6, {
                                groupSeparator: ',',
                              }) || 0
                        } ${pair?.reserve0.currency?.symbol}`
                      )}
                    </Typography>
                  </Box>

                  {userRewards && (
                    <Box sx={{ margin: '15px 0 25px 0' }}>
                      <Typography textAlign="center" marginBottom="5px" color="text1">
                        <Trans>
                          {pair.poolId === BalancedJs.utils.POOL_IDS.sICXICX
                            ? 'Your daily rewards'
                            : 'Your potential rewards'}
                        </Trans>
                      </Typography>
                      {pair.poolId === BalancedJs.utils.POOL_IDS.sICXICX ? (
                        <Typography textAlign="center" variant="p">
                          {userRewards?.isEqualTo(0)
                            ? 'N/A'
                            : userRewards
                            ? `~ ${userRewards.dp(2).toFormat()} BALN`
                            : 'N/A'}
                        </Typography>
                      ) : (
                        <Typography textAlign="center" variant="p">
                          {suppliedReward?.isEqualTo(0) ? 'N/A' : `~ ${suppliedReward?.dp(2).toFormat() || '...'} BALN`}
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
