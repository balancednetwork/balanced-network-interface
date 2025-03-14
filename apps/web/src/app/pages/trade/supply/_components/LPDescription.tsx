import React, { useCallback, useMemo } from 'react';

import { Currency, CurrencyAmount } from '@balancednetwork/sdk-core';
import { Trans, t } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { useMedia } from 'react-use';
import { Box, Flex } from 'rebass/styled-components';

import { Typography } from '@/app/theme';
import { PairState, useBalance, usePool, usePoolTokenAmounts } from '@/hooks/useV2Pairs';
import { useAllPairsByName } from '@/queries/backendv2';
import { useRatesWithOracle } from '@/queries/reward';
import {
  useBBalnAmount,
  useExternalPoolRewardShare,
  useResponsivePoolRewardShare,
  useSources,
} from '@/store/bbaln/hooks';
import { useDerivedMintInfo, useMintState } from '@/store/mint/hooks';
import { Field } from '@/store/mint/reducer';
import { useExternalRewards, useReward } from '@/store/reward/hooks';
import { useWithdrawnPercent } from '@/store/stakedLP/hooks';
import { tryParseAmount } from '@/store/swap/hooks';
import { useLiquidityTokenBalance } from '@/store/wallet/hooks';
import { formatBigNumber } from '@/utils';

import { MAX_BOOST } from '@/app/components/home/BBaln/utils';
import { useSignedInWallets } from '@/hooks/useWallets';
import { formatBalance, formatSymbol, formatValue } from '@/utils/formatter';
import { getXChainType, useXAccount } from '@balancednetwork/xwagmi';

export default function LPDescription() {
  const { currencies, pair, pairState, dependentField, noLiquidity, parsedAmounts, lpXChainId } = useDerivedMintInfo();
  const xAccount = useXAccount(getXChainType(lpXChainId));
  const pool = usePool(pair?.poolId, `${lpXChainId}/${xAccount?.address}`);

  const { independentField, typedValue, otherTypedValue } = useMintState();
  const sources = useSources();
  const getResponsiveRewardShare = useResponsivePoolRewardShare();
  const signedInWallets = useSignedInWallets();
  const signedIn = useMemo(() => signedInWallets.length > 0, [signedInWallets]);

  const getResponsiveExternalRewardShare = useExternalPoolRewardShare();
  const upSmall = useMedia('(min-width: 600px)');
  const userPoolBalance = useLiquidityTokenBalance(`${lpXChainId}/${xAccount?.address}`, pair);
  const totalPoolTokens = pair?.totalSupply;
  const pairName = useMemo(() => {
    if (currencies && currencies[Field.CURRENCY_A] && currencies[Field.CURRENCY_B]) {
      const name = `${currencies[Field.CURRENCY_A].wrapped.symbol}/${currencies[Field.CURRENCY_B].wrapped.symbol}`;
      return name;
    } else {
      return '';
    }
  }, [currencies]);
  const sourceName = pairName === 'sICX/BTCB' ? 'BTCB/sICX' : pairName;

  const { data: allPairs } = useAllPairsByName();

  const pairData = useMemo(() => (allPairs ? allPairs[pairName] : undefined), [allPairs, pairName]);

  const apy = useMemo(() => pairData && new BigNumber(pairData.balnApy), [pairData]);

  const [baseAmount, quoteAmount] = usePoolTokenAmounts(pool);

  const userPoolBalances = useBalance(pair?.poolId || -1);

  //calculate Your supply temporary value  and Your daily reward temporary value
  const formattedAmounts = useMemo(
    () => ({
      [independentField]: tryParseAmount(typedValue, currencies[independentField]),
      [dependentField]: noLiquidity
        ? tryParseAmount(otherTypedValue, currencies[dependentField])
        : parsedAmounts[dependentField],
    }),
    [currencies, typedValue, noLiquidity, otherTypedValue, dependentField, parsedAmounts, independentField],
  );

  const poolRewards = useReward(pairName === 'sICX/BTCB' ? 'BTCB/sICX' : pairName);
  const poolExternalRewards = useExternalRewards(pairName);
  const hasExternalRewards = poolExternalRewards && poolExternalRewards.length > 0;

  const tempTotalPoolTokens = new BigNumber(totalPoolTokens?.toFixed() || 0).plus(
    formattedAmounts[Field.CURRENCY_A]?.toFixed() || 0,
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const userRewards = useMemo(() => {
    return !!pair && !!totalPoolTokens && !!poolRewards && !!userPoolBalance
      ? poolRewards.times(
          new BigNumber(userPoolBalance.toFixed())
            .plus(formattedAmounts[Field.CURRENCY_A]?.toFixed() || 0)
            .div(tempTotalPoolTokens),
        )
      : undefined;
  }, [pair, totalPoolTokens, userPoolBalance, poolRewards, formattedAmounts[Field.CURRENCY_A]?.toFixed()]);

  const { baseValue, quoteValue } = useWithdrawnPercent(pair?.poolId ?? -1) || {};

  const totalSupply = useCallback((stakedValue: CurrencyAmount<Currency>, suppliedValue?: CurrencyAmount<Currency>) => {
    try {
      return !!stakedValue ? suppliedValue?.subtract(stakedValue) : suppliedValue;
    } catch (e) {
      return;
    }
  }, []);

  const baseCurrencyTotalSupply = useMemo(() => {
    const result = new BigNumber(totalSupply(baseValue, baseAmount)?.toFixed() || '0');
    return result.isNegative() ? new BigNumber(0) : result;
  }, [totalSupply, baseValue, baseAmount]);
  const quoteCurrencyTotalSupply = useMemo(() => {
    const result = new BigNumber(totalSupply(quoteValue, quoteAmount)?.toFixed() || '0');
    return result.isNegative() ? new BigNumber(0) : result;
  }, [totalSupply, quoteValue, quoteAmount]);

  const responsiveRewardShare = useMemo(
    () =>
      getResponsiveRewardShare(
        sources && sources[sourceName],
        formattedAmounts[Field.CURRENCY_A],
        formattedAmounts[Field.CURRENCY_B],
        allPairs && allPairs[pairName],
        userPoolBalances,
      ),
    [allPairs, formattedAmounts, getResponsiveRewardShare, pairName, sourceName, sources, userPoolBalances],
  );

  const userBbaln = useBBalnAmount();
  const isInitialSupply = useMemo(() => {
    if ((formattedAmounts[Field.CURRENCY_A] && userPoolBalances) || userPoolBalances) {
      return (
        userBbaln.isGreaterThan(0) &&
        ((formattedAmounts[Field.CURRENCY_A]?.greaterThan(0) && userPoolBalances.stakedLPBalance?.equalTo(0)) ||
          (userPoolBalances.stakedLPBalance?.equalTo(0) && userPoolBalances.balance?.greaterThan(0)))
      );
    }
  }, [formattedAmounts, userBbaln, userPoolBalances]);

  const rates = useRatesWithOracle();

  function getApyRange(apy: BigNumber | undefined, allPairs: any, pairName: string) {
    return apy && allPairs
      ? `${formatValue(
          apy
            .plus(allPairs[pairName].feesApy)
            .plus(allPairs[pairName].externalRewardsTotalAPR / 100)
            .times(100)
            .dp(2, BigNumber.ROUND_HALF_UP)
            .toFixed(),
          false,
        )}% - ${formatValue(
          apy
            .times(MAX_BOOST)
            .plus(allPairs[pairName].feesApy)
            .plus(allPairs[pairName].externalRewardsTotalAPR / 100)
            .times(100)
            .dp(2)
            .toFixed(),
          false,
        )}% APR`
      : '-';
  }

  return (
    <>
      <Flex bg="bg2" flex={1} flexDirection="column" minHeight={signedIn ? [505, 350] : [355, 320]}>
        {pairState === PairState.NOT_EXISTS && (
          <Flex flex={1} padding={[5, 7]} flexDirection="column">
            <Typography variant="h3" mb={2} marginBottom={40}>
              {`${formatSymbol(currencies[Field.CURRENCY_A]?.symbol)} / ${formatSymbol(
                currencies[Field.CURRENCY_B]?.symbol,
              )}`}{' '}
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
          <Box flex={1} padding={[5, 7]}>
            {poolRewards || hasExternalRewards ? (
              <Typography variant="h3" mb={2} marginBottom={40}>
                {t`${formatSymbol(currencies[Field.CURRENCY_A]?.symbol)} / ${formatSymbol(currencies[Field.CURRENCY_B]?.symbol)}
                    liquidity pool${upSmall ? ': ' : ''}`}{' '}
                <Typography fontWeight="normal" fontSize={16} as={upSmall ? 'span' : 'p'}>
                  {getApyRange(apy, allPairs, pairName)}
                </Typography>
              </Typography>
            ) : (
              <Typography variant="h3" mb={2} marginBottom={40}>
                {t`${formatSymbol(currencies[Field.CURRENCY_A]?.symbol)} / ${formatSymbol(currencies[Field.CURRENCY_B]?.symbol)} liquidity pool`}
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
                {pair && !signedIn && (
                  <Flex alignItems="center" justifyContent="center" height="100%">
                    <Typography textAlign="center" marginBottom="5px" color="text1">
                      <Trans>Sign in to view your liquidity details.</Trans>
                    </Typography>
                  </Flex>
                )}

                {pair && signedIn && (
                  <>
                    <Box sx={{ margin: '15px 0 25px 0' }}>
                      <Typography textAlign="center" marginBottom="5px" color="text1">
                        <Trans>Your supply</Trans>
                      </Typography>

                      <Typography textAlign="center" variant="p">
                        {formatBigNumber(
                          baseCurrencyTotalSupply.plus(formattedAmounts[Field.CURRENCY_A]?.toFixed() || 0),
                          'currency',
                        )}{' '}
                        {formatSymbol(pair?.reserve0.currency?.symbol)}
                        <br />
                        {formatBigNumber(
                          quoteCurrencyTotalSupply.plus(formattedAmounts[Field.CURRENCY_B]?.toFixed() || 0),
                          'currency',
                        )}{' '}
                        {formatSymbol(pair?.reserve1.currency?.symbol)}
                      </Typography>
                    </Box>

                    {(userRewards || hasExternalRewards) && (
                      <Box sx={{ margin: '15px 0 25px 0' }}>
                        <Typography textAlign="center" marginBottom="5px" color="text1">
                          <Trans>Your potential rewards</Trans>
                        </Typography>

                        {userRewards && (
                          <Typography textAlign="center" variant="p">
                            {poolRewards
                              ? isInitialSupply && lpXChainId === '0x1.icon'
                                ? `${formatBigNumber(
                                    poolRewards.times(responsiveRewardShare),
                                    'currency',
                                  )} - ${formatBigNumber(
                                    poolRewards.times(responsiveRewardShare).times(2.5),
                                    'currency',
                                  )} BALN`
                                : `${formatBigNumber(poolRewards.times(responsiveRewardShare), 'currency')} BALN`
                              : 'N/A'}
                          </Typography>
                        )}

                        {poolExternalRewards?.map(item => {
                          return (
                            <Typography key={item.currency.symbol} textAlign="center" variant="p">
                              {`${formatValue(
                                getResponsiveExternalRewardShare(
                                  item,
                                  userPoolBalances,
                                  formattedAmounts[Field.CURRENCY_A],
                                  formattedAmounts[Field.CURRENCY_B],
                                  pairData?.stakedLP,
                                ).toFixed(),
                                false,
                              )} ${item.currency.symbol}`}
                            </Typography>
                          );
                        })}
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
                      {formatBalance(pair?.reserve0.toFixed(), rates?.[pair.reserve0.currency?.symbol]?.toFixed())}{' '}
                      {formatSymbol(pair?.reserve0.currency?.symbol)}
                      <br />
                      {formatBalance(pair?.reserve1.toFixed(), rates?.[pair.reserve1.currency?.symbol]?.toFixed())}{' '}
                      {formatSymbol(pair?.reserve1.currency?.symbol)}
                    </Typography>
                  )}
                </Box>

                {(poolRewards || hasExternalRewards) && (
                  <Box sx={{ margin: '15px 0 25px 0' }}>
                    <Typography textAlign="center" marginBottom="5px" color="text1">
                      <Trans>Total daily rewards</Trans>
                    </Typography>
                    {poolRewards && (
                      <Typography textAlign="center" variant="p">
                        {formatValue(poolRewards.toFixed(), false)} BALN
                      </Typography>
                    )}
                    {poolExternalRewards?.map(item => {
                      return (
                        <Typography key={item.currency.symbol} textAlign="center" variant="p">
                          {`${formatValue(item.toFixed(), false)} ${item.currency.symbol}`}
                        </Typography>
                      );
                    })}
                  </Box>
                )}
              </Box>
            </Flex>
          </Box>
        )}
      </Flex>
    </>
  );
}
