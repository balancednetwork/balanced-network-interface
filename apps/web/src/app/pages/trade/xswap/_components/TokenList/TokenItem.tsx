import Divider from '@/app/components/Divider';
import { DataText } from '@/app/components/List';
import { Typography } from '@/app/theme';
import { TokenStats, useTokenTrendData } from '@/queries/backendv2';
import { formatPrice, formatPriceChange, getFormattedNumber } from '@/utils/formatter';
import React from 'react';
import { Box, Flex } from 'rebass';
import { Grid } from '.';
import { COMBINED_TOKENS_MAP_BY_ADDRESS, useICX } from '@/constants/tokens';
import CurrencyLogo from '@/app/components/CurrencyLogo';
import useTimestampRounded from '@/hooks/useTimestampRounded';
import Sparkline from './Sparkline';
import { LoaderComponent } from '@/app/pages/vote/_components/styledComponents';
import { useAssetManagerTokens } from '../../../bridge/_hooks/useAssetManagerTokens';
import { XToken } from '../../../bridge/types';
import AssetManagerTokenBreakdown from '@/app/components/AssetManagerTokenBreakdown';
import { CurrencyAmount } from '@balancednetwork/sdk-core';

type TokenItemProps = {
  token: TokenStats;
  isLast: boolean;
};

const TokenItem = ({ token, isLast }: TokenItemProps) => {
  const ICX = useICX();
  const currency = token.symbol === 'ICX' ? ICX : COMBINED_TOKENS_MAP_BY_ADDRESS[token.address];
  const tsStart = useTimestampRounded(1000 * 60, 7);
  const tsEnd = useTimestampRounded(1000 * 60);
  const start = Math.floor(tsStart / 1000);
  const end = Math.floor(tsEnd / 1000);
  const { data: trendData } = useTokenTrendData(token.symbol, start, end);
  const { data: assetManagerTokensBreakdown } = useAssetManagerTokens();

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
              <Flex>
                <Typography color="text" fontSize={16}>
                  {token.name.replace(' TOKEN', ' Token')}
                </Typography>
                {amounts && amounts.length > 1 && (
                  <AssetManagerTokenBreakdown amounts={amounts} spacing={{ x: 5, y: 0 }} />
                )}
              </Flex>
              <Typography color="text1" fontSize={16}>
                {token.symbol}
              </Typography>
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
            <Typography variant="p" color="text1">
              {getFormattedNumber(token.total_supply, 'number')} {token.symbol}
            </Typography>
          </Flex>
        </DataText>
        <DataText>{`$${getFormattedNumber(token.liquidity, 'number')}`}</DataText>
        <DataText>{trendData ? <Sparkline data={trendData} /> : <LoaderComponent />}</DataText>
      </Grid>
      {!isLast && <Divider />}
    </>
  );
};

export default TokenItem;
