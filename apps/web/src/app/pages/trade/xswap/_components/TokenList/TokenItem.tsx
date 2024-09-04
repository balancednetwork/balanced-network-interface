import AssetManagerTokenBreakdown from '@/app/components/AssetManagerTokenBreakdown';
import { ChainLogo } from '@/app/components/ChainLogo';
import CurrencyLogo from '@/app/components/CurrencyLogo';
import Divider from '@/app/components/Divider';
import { DataText } from '@/app/components/List';
import { Typography, sizes } from '@/app/theme';
import { COMBINED_TOKENS_MAP_BY_ADDRESS, useICX } from '@/constants/tokens';
import { useAssetManagerTokens } from '@/hooks/useAssetManagerTokens';
import useTimestampRounded from '@/hooks/useTimestampRounded';
import { TokenStats, useTokenTrendData } from '@/queries/backendv2';
import { formatPrice, formatPriceChange, getFormattedNumber } from '@/utils/formatter';
import { ICON_XCALL_NETWORK_ID } from '@/xwagmi/constants';
import { xChainMap } from '@/xwagmi/constants/xChains';
import { XToken } from '@/xwagmi/types';
import { getSupportedXChainIdsForToken } from '@/xwagmi/xcall/utils';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import React from 'react';
import { useMedia } from 'react-use';
import { Box, Flex } from 'rebass';
import styled from 'styled-components';
import { Grid } from '.';
import Sparkline from './Sparkline';

type TokenItemProps = {
  token: TokenStats;
  isLast: boolean;
};

const Loader = styled.span`
  @keyframes blink {
    0% {
      opacity: 0;
      transform: scale(0.4);
    }
    50% {
      opacity: 1;
      transform: scale(1);
    }
    100% {
      opacity: 0;
      transform: scale(0.4);
    }
  }

  span {
    animation: blink 2s infinite;
    display: inline-flex;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: #ffffff;
    margin-left: 3px;
  }

  span:nth-of-type(1) {
    animation-delay: 100ms;
  }
  span:nth-of-type(2) {
    animation-delay: 250ms;
  }
  span:nth-of-type(3) {
    animation-delay: 400ms;
  }
`;

export const LoaderComponent = () => (
  <Loader>
    <span></span>
    <span></span>
    <span></span>
  </Loader>
);

const ChainsWrapper = styled.div`
  margin-top: 3px;

  img {
    margin-right: 8px;
  }
`;

const TokenItem = ({ token, isLast }: TokenItemProps) => {
  const ICX = useICX();
  const tsStart = useTimestampRounded(1000 * 60, 7);
  const tsEnd = useTimestampRounded(1000 * 60);
  const start = Math.floor(tsStart / 1000);
  const end = Math.floor(tsEnd / 1000);
  const { data: trendData } = useTokenTrendData(token.symbol, start, end);
  const { data: assetManagerTokensBreakdown } = useAssetManagerTokens();
  const isSmall = !useMedia(`(min-width: ${sizes.upLarge}px)`);

  const currency = React.useMemo(
    () => (token.symbol === 'ICX' ? ICX : COMBINED_TOKENS_MAP_BY_ADDRESS[token.address]),
    [token, ICX],
  );

  const xChainIds = React.useMemo(() => {
    const currencyXChainIds = getSupportedXChainIdsForToken(currency);
    return currencyXChainIds.length
      ? currencyXChainIds.sort((a, b) => xChainMap[a].name.localeCompare(xChainMap[b].name))
      : [ICON_XCALL_NETWORK_ID];
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
                {xChainIds.map(xChainId => (
                  <ChainLogo key={xChainId} chain={xChainMap[xChainId]} size="18px" />
                ))}
              </ChainsWrapper>
            </Box>
          </Flex>
        </DataText>
        <DataText>
          <Flex alignItems="flex-end" flexDirection="column">
            <Typography variant="p">{formatPrice(token.price)}</Typography>
            <Typography variant="p" color={token.price >= token.price_24h ? 'primary' : 'alert'}>
              {formatPriceChange(token.price_24h_change)}
            </Typography>
          </Flex>
        </DataText>
        <DataText>
          <Flex alignItems="flex-end" flexDirection="column" pl={2}>
            <Typography variant="p">{getFormattedNumber(token.market_cap, 'currency0')}</Typography>
            <Flex>
              {amounts && amounts.length > 1 && (
                <Box marginRight={1}>
                  <AssetManagerTokenBreakdown amounts={amounts} spacing={{ x: 0, y: 1 }} />
                </Box>
              )}
              <Typography variant="p" color="text1" style={{ whiteSpace: isSmall ? 'initial' : 'nowrap' }}>
                {getFormattedNumber(token.total_supply, token.price > 1000 ? 'number2' : 'number')} {token.symbol}
              </Typography>
            </Flex>
          </Flex>
        </DataText>
        <DataText>
          <Flex alignItems="flex-end" flexDirection="column" pl={2}>
            <Typography variant="p">{`$${getFormattedNumber(token.liquidity, 'number')}`}</Typography>
            {token.price > 0 && (
              <Typography variant="p" color="text1">
                {getFormattedNumber(token.liquidity / token.price, token.price > 1000 ? 'number2' : 'number')}{' '}
                {token.symbol}
              </Typography>
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
