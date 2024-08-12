import React, { useMemo, useState } from 'react';

import { MetaToken } from '@/queries';
import { useAllTokensByAddress, useTokenTrendData } from '@/queries/backendv2';
import { useMedia } from 'react-use';
import { Flex, Box, Text } from 'rebass/styled-components';
import styled, { css } from 'styled-components';

import Divider from '@/components/Divider';
import DropdownLink from '@/components/DropdownLink';
import { BoxPanel } from '@/components/Panel';
import SearchInput from '@/components/SearchInput';
import { CurrencyLogoFromURI } from '@/components/shared/CurrencyLogo';
import Sparkline from '@/components/Sparkline';
import useSort from '@/hooks/useSort';
import useTimestampRounded from '@/hooks/useTimestampRounded';
import { LoaderComponent } from '@/pages/PerformanceDetails/utils';
import { Typography } from '@/theme';
import { formatPriceChange, getFormattedNumber } from '@/utils/formatter';
import { useAssetManagerTokens } from '@/queries/assetManager';
import AssetManagerTokenBreakdown from '@/components/AssetManagerTokenBreakdown';
import Skeleton from '@/components/Skeleton';

export const COMPACT_ITEM_COUNT = 8;

const List = styled(Box)`
  -webkit-overflow-scrolling: touch;
  min-width: 840px;
  overflow: hidden;
`;

const DashGrid = styled(Box)`
  display: grid;
  gap: 1em;
  align-items: center;
  grid-template-columns: 24fr 16fr 15fr 11fr 14fr;
  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-template-columns: 6fr 6fr 9fr 5fr 7fr;
  `}

  > * {
    justify-content: flex-end;
    &:first-child {
      justify-content: flex-start;
      text-align: left;
    }
  }
`;

const DataText = styled(Flex)`
  display: flex;
  font-size: 16px;
  color: #ffffff;
  align-items: center;
  line-height: 1.4;
`;

export const HeaderText = styled(Flex)<{ className?: string }>`
  display: flex;
  font-size: 14px;
  color: #d5d7db;
  letter-spacing: 3px;
  text-transform: uppercase;
  align-items: center;
  cursor: pointer;
  position: relative;
  transition: all ease 200ms;
  padding-left: 15px;
  white-space: nowrap;

  &:before,
  &:after,
  span:after,
  span:before {
    content: '';
    position: absolute;
    width: 8px;
    height: 2px;
    border-radius: 2px;
    background: ${({ theme }) => theme.colors.primary};
    display: inline-block;
    top: 50%;
    transition: all ease 200ms;
    right: 0;
    transform-origin: center;
    opacity: 0;
    transform: rotate(0) translate3d(0, 0, 0);
  }

  ${props =>
    props.className === 'ASC' &&
    css`
      padding-right: 15px;
      padding-left: 0;
      &:before,
      &:after,
      span:after,
      span:before {
        opacity: 1;
      }

      &:before,
      span:before {
        transform: rotate(-45deg) translate3d(-2px, -3px, 0);
      }

      &:after,
      span:after {
        transform: rotate(45deg) translate3d(0px, -1px, 0);
      }
    `};

  ${props =>
    props.className === 'DESC' &&
    css`
      padding-right: 15px;
      padding-left: 15px;
      &:before,
      &:after,
      span:after,
      span:before {
        opacity: 1;
      }

      &:before,
      span:before {
        transform: rotate(45deg) translate3d(-3px, 2px, 0);
      }

      &:after,
      span:after {
        transform: rotate(-45deg) translate3d(1px, 0, 0);
      }
    `};

  &:first-of-type {
    padding-left: 0;
    &::before,
    &::after {
      display: none;
    }

    span {
      position: relative;

      &::before,
      &:after {
        margin-right: -15px;
      }
    }
  }
`;

export const StyledSkeleton = styled(Skeleton)`
  background-color: rgba(44, 169, 183, 0.2) !important;
`;

const SkeletonTokenPlaceholder = () => {
  return (
    <DashGrid my={4}>
      <DataText>
        <Flex alignItems="center">
          <Box sx={{ minWidth: '50px' }}>
            <StyledSkeleton variant="circle" width={40} height={40} />
          </Box>
          <Box ml={2} sx={{ minWidth: '160px' }}>
            <StyledSkeleton width={130} />
            <StyledSkeleton width={70} />
          </Box>
        </Flex>
      </DataText>
      <DataText>
        <Flex alignItems="flex-end" flexDirection="column">
          <Typography variant="p">
            <StyledSkeleton width={80} />
          </Typography>
          <Typography variant="p">
            <StyledSkeleton width={80} />
          </Typography>
        </Flex>
      </DataText>
      <DataText>
        <Flex alignItems="flex-end" flexDirection="column" minWidth={200} pl={2}>
          <Typography variant="p">
            <StyledSkeleton width={120} />
          </Typography>
          <Typography variant="p">
            <StyledSkeleton width={160} />
          </Typography>
        </Flex>
      </DataText>
      <DataText>
        <StyledSkeleton width={110} />
      </DataText>
      <DataText>
        <StyledSkeleton width={90} />
      </DataText>
    </DashGrid>
  );
};

type TokenItemProps = {
  token: MetaToken;
  isLast: boolean;
};

const TokenItem = ({ token, isLast }: TokenItemProps) => {
  const tsStart = useTimestampRounded(1000 * 60, 7);
  const tsEnd = useTimestampRounded(1000 * 60);
  const start = Math.floor(tsStart / 1000);
  const end = Math.floor(tsEnd / 1000);
  const { data: trendData } = useTokenTrendData(token.symbol, start, end);
  const { data: assetManagerTokensBreakdown } = useAssetManagerTokens();
  const tokenBreakdown = assetManagerTokensBreakdown && assetManagerTokensBreakdown[token.address];

  return (
    <>
      <DashGrid my={4}>
        <DataText>
          <Flex alignItems="center">
            <Box sx={{ minWidth: '50px' }}>
              <CurrencyLogoFromURI address={token.address} size="40px" />
            </Box>
            <Box ml={2} sx={{ minWidth: '160px' }}>
              <Flex>
                <Text>{token.name.replace(' TOKEN', ' Token')}</Text>
                {tokenBreakdown && tokenBreakdown.length > 1 && (
                  <AssetManagerTokenBreakdown breakdown={tokenBreakdown} spacing={{ x: 5, y: 0 }} />
                )}
              </Flex>
              <Text color="text1">{token.symbol}</Text>
            </Box>
          </Flex>
        </DataText>
        <DataText>
          <Flex alignItems="flex-end" flexDirection="column">
            <Typography variant="p">{getFormattedNumber(token.price, 'price')}</Typography>
            <Typography variant="p" color={token.price >= token.price_24h ? 'primary' : 'alert'}>
              {formatPriceChange(token.price_24h_change)}
            </Typography>
          </Flex>
        </DataText>
        <DataText>
          <Flex alignItems="flex-end" flexDirection="column" minWidth={200} pl={2}>
            <Typography variant="p">{getFormattedNumber(token.market_cap, 'currency0')}</Typography>
            <Typography variant="p" color="text1">
              {getFormattedNumber(token.total_supply, 'number')} {token.symbol}
            </Typography>
          </Flex>
        </DataText>
        <DataText>{`$${getFormattedNumber(token.liquidity, 'number')}`}</DataText>
        <DataText>{trendData ? <Sparkline data={trendData} /> : <LoaderComponent />}</DataText>
      </DashGrid>
      {!isLast && <Divider />}
    </>
  );
};

export default React.memo(function TokenSection() {
  const { data: allTokens } = useAllTokensByAddress();
  const { sortBy, handleSortSelect, sortData } = useSort({ key: 'market_cap', order: 'DESC' });
  const [showingExpanded, setShowingExpanded] = useState(false);
  const [searched, setSearched] = useState('');

  const tokens = useMemo(() => {
    if (!allTokens) return [];
    const filteredTokens = Object.values(allTokens).filter(token => {
      const tokenName = token.name.toLowerCase();
      const tokenSymbol = token.symbol.toLowerCase();
      const search = searched.toLowerCase();
      return tokenName.includes(search) || tokenSymbol.includes(search);
    });
    return sortData(filteredTokens);
  }, [allTokens, searched, sortData]);

  const noTokensFound = searched && tokens.length === 0;
  const isSmallScreen = useMedia('(max-width: 800px)');

  return (
    <BoxPanel bg="bg2" id="tokens">
      <Flex justifyContent="space-between" flexWrap="wrap">
        <Typography variant="h2" mb={5} mr="20px">
          Tokens
        </Typography>
        <Box width={isSmallScreen ? '100%' : '295px'} mb={isSmallScreen ? '25px' : 0}>
          <SearchInput value={searched} onChange={e => setSearched(e.target.value)} />
        </Box>
      </Flex>
      <Box overflow="auto">
        <List>
          {!noTokensFound && (
            <DashGrid>
              <HeaderText
                role="button"
                className={sortBy.key === 'name' ? sortBy.order : ''}
                onClick={() =>
                  handleSortSelect({
                    key: 'name',
                  })
                }
              >
                <span>ASSET</span>
              </HeaderText>
              <HeaderText
                role="button"
                className={sortBy.key === 'price_24h_change' ? sortBy.order : ''}
                onClick={() =>
                  handleSortSelect({
                    key: 'price_24h_change',
                  })
                }
              >
                PRICE (24H)
              </HeaderText>
              <HeaderText
                role="button"
                className={sortBy.key === 'market_cap' ? sortBy.order : ''}
                onClick={() =>
                  handleSortSelect({
                    key: 'market_cap',
                  })
                }
              >
                MARKETCAP
              </HeaderText>
              <HeaderText
                role="button"
                className={sortBy.key === 'liquidity' ? sortBy.order : ''}
                onClick={() =>
                  handleSortSelect({
                    key: 'liquidity',
                  })
                }
              >
                LIQUIDITY
              </HeaderText>
              <HeaderText
                style={{ cursor: 'default' }}
                // role="button"
                // className={sortBy.key === 'holders' ? sortBy.order : ''}
                // onClick={() =>
                //   handleSortSelect({
                //     key: 'holders',
                //   })
                // }
              >
                7d trend
              </HeaderText>
            </DashGrid>
          )}

          {tokens ? (
            <>
              {tokens.map((token, index, arr) =>
                showingExpanded || index < COMPACT_ITEM_COUNT ? (
                  <TokenItem
                    key={token.symbol}
                    token={token}
                    isLast={index === arr.length - 1 || (!showingExpanded && index === COMPACT_ITEM_COUNT - 1)}
                  />
                ) : null,
              )}
              {noTokensFound && (
                <Typography width="100%" paddingTop="30px" fontSize={16} color="text">
                  Couldn't find any listings for <strong>{searched}</strong>.
                </Typography>
              )}
            </>
          ) : (
            <>
              <SkeletonTokenPlaceholder />
              <Divider />
              <SkeletonTokenPlaceholder />
              <Divider />
              <SkeletonTokenPlaceholder />
              <Divider />
              <SkeletonTokenPlaceholder />
              <Divider />
              <SkeletonTokenPlaceholder />
            </>
          )}
        </List>
      </Box>

      {tokens.length > COMPACT_ITEM_COUNT && (
        <Box pb="3px">
          <DropdownLink expanded={showingExpanded} setExpanded={setShowingExpanded} />
        </Box>
      )}
    </BoxPanel>
  );
});
