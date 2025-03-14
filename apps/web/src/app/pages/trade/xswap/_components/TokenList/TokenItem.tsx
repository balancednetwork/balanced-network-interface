import AssetManagerTokenBreakdown from '@/app/components/AssetManagerTokenBreakdown';
import { ChainLogo } from '@/app/components/ChainLogo';
import CurrencyLogo from '@/app/components/CurrencyLogo';
import Divider from '@/app/components/Divider';
import { DataText } from '@/app/components/List';
import { MouseoverTooltip } from '@/app/components/Tooltip';
import { LoaderComponent } from '@/app/pages/vote/_components/styledComponents';
import { Typography, sizes } from '@/app/theme';
import { COMBINED_TOKENS_MAP_BY_ADDRESS, ORACLE_PRICED_TOKENS, useICX } from '@/constants/tokens';
import { useAssetManagerTokens } from '@/hooks/useAssetManagerTokens';
import useTimestampRounded from '@/hooks/useTimestampRounded';
import { TokenStats, useTokenTrendData } from '@/queries/backendv2';
import { useWithdrawalsFloorDEXData } from '@/store/swap/hooks';
import { formatBalance, formatPrice, formatPriceChange, getFormattedNumber } from '@/utils/formatter';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { getSupportedXChainIdsForSwapToken } from '@balancednetwork/xwagmi';
import { xChainMap } from '@balancednetwork/xwagmi';
import { xTokenMap } from '@balancednetwork/xwagmi';
import { XToken } from '@balancednetwork/xwagmi';
import BigNumber from 'bignumber.js';
import React, { useMemo } from 'react';
import { useMedia } from 'react-use';
import { Box, Flex } from 'rebass';
import styled from 'styled-components';
import { Grid } from '.';
import Sparkline from './Sparkline';

type TokenItemProps = {
  token: TokenStats;
  price: BigNumber | undefined;
  isLast: boolean;
};

const ChainsWrapper = styled.div`
  margin-top: 3px;

  >* {
    margin-right: 8px;
  }
`;

const TokenItem = ({ token, price, isLast }: TokenItemProps) => {
  const ICX = useICX();
  const tsStart = useTimestampRounded(1000 * 60, 7);
  const tsEnd = useTimestampRounded(1000 * 60);
  const start = Math.floor(tsStart / 1000);
  const end = Math.floor(tsEnd / 1000);
  const { data: trendData } = useTokenTrendData(token.symbol, start, end);
  const { data: assetManagerTokensBreakdown } = useAssetManagerTokens();
  const isSmall = !useMedia(`(min-width: ${sizes.upLarge}px)`);
  const { data: withdrawalLimits } = useWithdrawalsFloorDEXData();

  const currency = React.useMemo(
    () => (token.symbol === 'ICX' ? ICX : COMBINED_TOKENS_MAP_BY_ADDRESS[token.address]),
    [token, ICX],
  );

  const xChainIds = React.useMemo(() => {
    const currencyXChainIds = getSupportedXChainIdsForSwapToken(currency);
    return currencyXChainIds.sort((a, b) => xChainMap[a].name.localeCompare(xChainMap[b].name));
  }, [currency]);

  const amounts = React.useMemo(() => {
    if (!assetManagerTokensBreakdown) return [];
    return Object.values(assetManagerTokensBreakdown).reduce((breakdown, item) => {
      if (item.depositedAmount.currency.symbol === token.symbol) {
        breakdown.push(item.depositedAmount);
      }
      return breakdown;
    }, [] as CurrencyAmount<XToken>[]);
  }, [assetManagerTokensBreakdown, token]);

  const limit = useMemo(() => {
    const limitData = withdrawalLimits?.find(limit => limit.token.symbol === token.symbol);
    return limitData;
  }, [withdrawalLimits, token]);

  const availableRatio = useMemo(() => {
    return limit?.current.minus(limit?.floor).div(limit?.current);
  }, [limit]);

  const showWarning = useMemo(() => {
    if (!limit || !availableRatio) return false;

    return limit.percentageFloor.div(2).isGreaterThanOrEqualTo(availableRatio);
  }, [limit, availableRatio]);

  const isOraclePriced = ORACLE_PRICED_TOKENS.includes(token.symbol);

  return (
    <>
      <Grid>
        <DataText>
          <Flex alignItems="center">
            <Box sx={{ minWidth: '50px' }}>
              <CurrencyLogo currency={currency} size="40px" />
            </Box>
            <Box ml={2} sx={{ minWidth: '160px' }}>
              <Flex flexDirection={isSmall ? 'column' : 'row'}>
                <Typography color="text" fontSize={16} marginRight="7px">
                  {token.name.replace(' TOKEN', ' Token')}
                </Typography>
                <Typography color="text2" fontSize={14} paddingTop="2px">
                  {token.symbol}
                </Typography>
              </Flex>
              <ChainsWrapper>
                {xChainIds.map(xChainId => {
                  try {
                    const spokeAssetVersion: string | undefined = xTokenMap[xChainId].find(xToken => {
                      return xToken.symbol === currency.symbol;
                    })?.spokeVersion;

                    return (
                      <MouseoverTooltip
                        key={xChainId}
                        text={`${xChainMap[xChainId].name}${spokeAssetVersion ? ' (' + spokeAssetVersion + ')' : ''}`}
                        autoWidth
                        placement="bottom"
                      >
                        <ChainLogo chain={xChainMap[xChainId]} size="18px" />
                      </MouseoverTooltip>
                    );
                  } catch (e) {
                    return null;
                  }
                })}
              </ChainsWrapper>
            </Box>
          </Flex>
        </DataText>
        <DataText>
          <Flex alignItems="flex-end" flexDirection="column">
            <Typography variant="p">{price ? formatPrice(price.toFixed()) : '-'}</Typography>
            {!isOraclePriced && (
              <Typography variant="p" color={token.price >= token.price_24h ? 'primary' : 'alert'}>
                {formatPriceChange(token.price_24h_change)}
              </Typography>
            )}
          </Flex>
        </DataText>
        <DataText>
          <Flex alignItems="flex-end" flexDirection="column" pl={2}>
            <Typography variant="p">{`$${getFormattedNumber(token.liquidity, 'number')}`}</Typography>
            <Flex>
              {amounts && amounts.length > 1 && (
                <Box marginRight={1}>
                  <AssetManagerTokenBreakdown amounts={amounts} spacing={{ x: 0, y: 1 }} />
                </Box>
              )}
              {token.price > 0 && (
                <Typography variant="p" color="text1">
                  {getFormattedNumber(token.liquidity / token.price, token.price > 1000 ? 'number2' : 'number')}{' '}
                  {token.symbol}
                </Typography>
              )}
            </Flex>
          </Flex>
        </DataText>
        <DataText>
          <Flex alignItems="flex-end" flexDirection="column" pl={2}>
            {limit ? (
              <>
                <Flex>
                  <Typography variant="p">
                    {`$${getFormattedNumber(new BigNumber(limit.available.toFixed()).times(price || 1).toNumber(), 'number')}`}
                  </Typography>
                  {availableRatio && (
                    <Typography ml={1} color={showWarning ? 'alert' : 'primary'}>
                      {`(~${getFormattedNumber(availableRatio.toNumber(), 'percent0')})`}
                    </Typography>
                  )}
                </Flex>
                <Typography variant="p" color="text1">
                  {formatBalance(limit.available.toFixed(), price?.toFixed() || 1)} {token.symbol}
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="p">{`$${getFormattedNumber(token.liquidity, 'number')}`}</Typography>
                <Typography variant="p" color="text1">
                  {getFormattedNumber(token.liquidity / token.price, token.price > 1000 ? 'number2' : 'number')}{' '}
                  {token.symbol}
                </Typography>
              </>
            )}
          </Flex>
        </DataText>
        <DataText>{trendData ? <Sparkline data={trendData} /> : <LoaderComponent />}</DataText>
      </Grid>
      {!isLast && <Divider />}
    </>
  );
};

export default TokenItem;
