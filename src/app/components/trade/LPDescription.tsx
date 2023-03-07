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
import { HIGH_PRICE_ASSET_DP } from 'constants/tokens';
import { PairState, useSuppliedTokens } from 'hooks/useV2Pairs';
import { useAllPairsByName } from 'queries/backendv2';
import { useICXConversionFee } from 'queries/reward';
import { useSources } from 'store/bbaln/hooks';
import { Field } from 'store/mint/actions';
import { useDerivedMintInfo, useMintState } from 'store/mint/hooks';
import { useReward } from 'store/reward/hooks';
import { useWithdrawnPercent } from 'store/stakedLP/hooks';
import { tryParseAmount } from 'store/swap/hooks';
import { useLiquidityTokenBalance } from 'store/wallet/hooks';
import { formatBigNumber } from 'utils';

import { MAX_BOOST } from '../home/BBaln/utils';
import QuestionHelper, { QuestionWrapper } from '../QuestionHelper';

export default function LPDescription() {
  const { currencies, pair, pairState, dependentField, noLiquidity, parsedAmounts } = useDerivedMintInfo();
  const { independentField, typedValue, otherTypedValue } = useMintState();
  const sources = useSources();
  const { account } = useIconReact();
  const upSmall = useMedia('(min-width: 600px)');
  const { data: icxConversionFee } = useICXConversionFee();
  const userPoolBalance = useLiquidityTokenBalance(account, pair);
  const totalPoolTokens = pair?.totalSupply;
  const token0Deposited =
    !!pair &&
    !!totalPoolTokens &&
    !!userPoolBalance &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    JSBI.greaterThanOrEqual(totalPoolTokens.quotient, userPoolBalance.quotient) &&
    totalPoolTokens.greaterThan(0)
      ? pair.getLiquidityValue(pair.token0, totalPoolTokens, userPoolBalance, false)
      : undefined;
  const pairName = useMemo(() => {
    if (currencies && currencies.CURRENCY_A && currencies.CURRENCY_B) {
      const name = `${currencies.CURRENCY_A.symbol}/${currencies.CURRENCY_B.symbol}`;
      return name.startsWith('ICX/') ? 'sICX/ICX' : name;
    } else {
      return '';
    }
  }, [currencies]);

  const { data: allPairs } = useAllPairsByName();
  const apy = useMemo(() => allPairs && new BigNumber(allPairs[pairName].balnApy), [allPairs, pairName]);

  const balances = useSuppliedTokens(
    pair?.poolId ?? -1,
    currencies[Field.CURRENCY_A],
    pair?.isQueue ? pair?.token1 : currencies[Field.CURRENCY_B],
  );
  //calulate Your supply temporary value  and Your daily reward temporary value
  const formattedAmounts = useMemo(
    () => ({
      [independentField]: tryParseAmount(typedValue, currencies[independentField]),
      [dependentField]: noLiquidity
        ? tryParseAmount(otherTypedValue, currencies[dependentField])
        : parsedAmounts[dependentField],
    }),
    [currencies, typedValue, noLiquidity, otherTypedValue, dependentField, parsedAmounts, independentField],
  );

  const poolRewards = useReward(pairName);
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

  const baseCurrencyTotalSupply = useMemo(
    () => new BigNumber(totalSupply(baseValue, balances?.base)?.toFixed() || '0'),
    [baseValue, balances],
  );
  const quoteCurrencyTotalSupply = new BigNumber(totalSupply(quoteValue, balances?.quote)?.toFixed() || '0');

  const tempTotalSupplyValue = new BigNumber(pair?.reserve0.toFixed() || 0).plus(
    new BigNumber(formattedAmounts[Field.CURRENCY_A]?.toFixed() || 0),
  );

  const suppliedReward = useMemo(
    () =>
      poolRewards
        ?.times(new BigNumber(formattedAmounts[Field.CURRENCY_A]?.toFixed() || 0).plus(baseCurrencyTotalSupply))
        .div(tempTotalSupplyValue.isZero() ? 1 : tempTotalSupplyValue),
    [baseCurrencyTotalSupply, formattedAmounts, tempTotalSupplyValue, poolRewards],
  );

  const boost = useMemo(() => {
    const pairName = pair ? `${pair.token0.symbol}/${pair.token1.symbol}` : '';
    if (sources && sources[pairName] && sources[pairName].balance.isGreaterThan(0)) {
      return sources[pairName].workingBalance.dividedBy(sources[pairName].balance);
    } else if (sources && pairName === 'ICX/sICX' && sources['sICX/ICX'].balance.isGreaterThan(0)) {
      return sources['sICX/ICX'].workingBalance.dividedBy(sources['sICX/ICX'].balance);
    } else {
      return new BigNumber(1);
    }
  }, [sources, pair]);

  return (
    <>
      <Flex bg="bg2" flex={1} flexDirection="column" minHeight={account ? [505, 350] : [355, 320]}>
        {pairState === PairState.NOT_EXISTS && (
          <Flex flex={1} padding={[5, 7]} flexDirection="column">
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
          <Box flex={1} padding={[5, 7]}>
            {poolRewards ? (
              <Typography variant="h3" mb={2} marginBottom={40}>
                {pair?.poolId !== BalancedJs.utils.POOL_IDS.sICXICX
                  ? t`${currencies[Field.CURRENCY_A]?.symbol} / ${currencies[Field.CURRENCY_B]?.symbol}
                    liquidity pool${upSmall ? ': ' : ''}`
                  : t`${currencies[Field.CURRENCY_A]?.symbol} queue${upSmall ? ': ' : ''}`}{' '}
                <Typography fontWeight="normal" fontSize={16} as={upSmall ? 'span' : 'p'}>
                  {apy
                    ? `${apy.times(100).dp(2, BigNumber.ROUND_HALF_UP).toFixed()}% - ${apy
                        .times(MAX_BOOST)
                        .times(100)
                        .dp(2)
                        .toFixed()}%`
                    : '-'}
                  {' APY'}
                  {pair?.poolId === BalancedJs.utils.POOL_IDS.sICXICX && (
                    <QuestionWrapper style={{ marginLeft: '3px' }}>
                      <QuestionHelper
                        width={350}
                        text={
                          <>
                            <Typography mb={3}>The ICX queue facilitates "instant unstaking".</Typography>
                            <Typography mb={3}>
                              You'll earn BALN while your ICX is in the queue. When you get to the front, your ICX will
                              be exchanged for sICX, plus an extra {`${icxConversionFee?.toSignificant(3) || '...'}%`}.
                            </Typography>
                            <Typography>
                              You'll need to claim and unstake your sICX before you can supply it again.
                            </Typography>
                          </>
                        }
                      ></QuestionHelper>
                    </QuestionWrapper>
                  )}
                </Typography>
              </Typography>
            ) : (
              <Typography variant="h3" mb={2} marginBottom={40}>
                {pair?.poolId !== BalancedJs.utils.POOL_IDS.sICXICX
                  ? t`${currencies[Field.CURRENCY_A]?.symbol} / ${currencies[Field.CURRENCY_B]?.symbol} liquidity pool`
                  : t`${currencies[Field.CURRENCY_A]?.symbol} queue`}
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
                                  .dp(HIGH_PRICE_ASSET_DP[pair.reserve0.currency?.address || ''] || 2)
                                  .toFormat() || '...'
                              : baseCurrencyTotalSupply
                                  ?.dp(HIGH_PRICE_ASSET_DP[pair.reserve0.currency?.address || ''] || 2)
                                  .toFormat() || '...'}{' '}
                            {pair?.reserve0.currency?.symbol}
                            <br />
                            {formattedAmounts[Field.CURRENCY_B]
                              ? new BigNumber(quoteCurrencyTotalSupply)
                                  .plus(formattedAmounts[Field.CURRENCY_B]?.toFixed() || 0)
                                  .dp(2)
                                  .toFormat() || '...'
                              : quoteCurrencyTotalSupply?.dp(2).toFormat() || '...'}{' '}
                            {pair?.reserve1.currency?.symbol}
                          </>
                        ) : (
                          `${
                            formattedAmounts[Field.CURRENCY_A]
                              ? new BigNumber(token0Deposited?.toFixed() || 0)
                                  .plus(formattedAmounts[Field.CURRENCY_A]?.toFixed() || 0)
                                  .dp(2)
                                  .toFormat()
                              : token0Deposited?.toFixed(2, {
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

                        <Typography textAlign="center" variant="p">
                          {suppliedReward?.isEqualTo(0) || suppliedReward?.isNaN()
                            ? 'N/A'
                            : `~ ${
                                suppliedReward?.times(boost).dp(2, BigNumber.ROUND_HALF_UP).toFormat() || '...'
                              } BALN`}
                        </Typography>
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
                          {pair?.reserve0.toFixed(HIGH_PRICE_ASSET_DP[pair.reserve0.currency?.address || ''] ? 3 : 0, {
                            groupSeparator: ',',
                          })}{' '}
                          {pair?.reserve0.currency?.symbol}
                          <br />
                          {pair?.reserve1.toFixed(HIGH_PRICE_ASSET_DP[pair.reserve1.currency?.address || ''] ? 3 : 0, {
                            groupSeparator: ',',
                          })}{' '}
                          {pair?.reserve1.currency?.symbol}
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
      </Flex>
    </>
  );
}
