import React from 'react';

import { Trans } from '@lingui/macro';
import { useMedia } from 'react-use';
import { Box, Flex } from 'rebass';
import styled, { useTheme } from 'styled-components';

import Divider from '@/app/components/Divider';
import DropdownLink from '@/app/components/DropdownLink';
import { BoxPanel } from '@/app/components/Panel';
import QuestionHelper, { QuestionWrapper } from '@/app/components/QuestionHelper';
import CancelSearchButton from '@/app/components/SearchModal/CancelSearchButton';
import { SearchWrap } from '@/app/components/SearchModal/CurrencySearch';
import SearchInput from '@/app/components/SearchModal/SearchInput';
import { HeaderText } from '@/app/components/SearchModal/styleds';
import { Typography } from '@/app/theme';
import { COMBINED_TOKENS_MAP_BY_ADDRESS } from '@/constants/tokens';
import useSort from '@/hooks/useSort';
import { TokenStats, useAllTokensByAddress } from '@/queries/backendv2';
import { useRatesWithOracle } from '@/queries/reward';
import { useTokenListConfig } from '@/store/lists/hooks';
import { getSupportedXChainForToken } from '@balancednetwork/xwagmi';
import SkeletonTokenPlaceholder from './SkeletonTokenPlaceholder';
import TokenItem from './TokenItem';

const COMPACT_ITEM_COUNT = 8;

const List = styled.div`
  -webkit-overflow-scrolling: touch;
  min-width: 915px;
  overflow: hidden;
`;

export const Grid = styled.div`
  display: grid;
  margin: 20px 0;
  gap: 1em;
  align-items: center;
  grid-template-columns: 12fr 10fr 12fr 12fr 13fr;
  ${({ theme }) => theme.mediaWidth.upLarge`
    grid-template-columns: 24fr 14fr 15fr 14fr 15fr;
  `}

  > *, ${HeaderText} {
      justify-content: flex-end;
      text-align: right;
      padding-left: 0;

      &:first-child {
        justify-content: flex-start;
        text-align: left;
      }
    }

  .recharts-wrapper {
    margin-left: auto;
  }
`;

const TokenList = () => {
  const { data: allTokens } = useAllTokensByAddress();
  const { sortBy, handleSortSelect, sortData } = useSort({ key: 'price_24h_change', order: 'DESC' });
  const [showingExpanded, setShowingExpanded] = React.useState(false);
  const theme = useTheme();
  const isSmallScreen = useMedia(`(minWidth: ${theme.mediaWidth.upSmall})`);
  const [query, setQuery] = React.useState('');
  const { community: isCommunityListEnabled } = useTokenListConfig();
  const prices = useRatesWithOracle();

  const tokens = React.useMemo(() => {
    if (!allTokens) return [];
    const filteredTokens = Object.values(allTokens).filter((token: TokenStats) => {
      const shouldShow = token.symbol !== 'wICX' && (isCommunityListEnabled || token.type === 'balanced');
      const tokenName = token.name.toLowerCase();
      const tokenSymbol = token.symbol.toLowerCase();
      const tokenXChains = getSupportedXChainForToken(COMBINED_TOKENS_MAP_BY_ADDRESS[token.address])?.map(
        xChain => xChain.name,
      );
      const search = query.toLowerCase();
      return (
        shouldShow &&
        (tokenName.includes(search) ||
          tokenSymbol.includes(search) ||
          tokenXChains?.some(xChain => xChain.toLowerCase().includes(search)))
      );
    });
    return sortData(filteredTokens);
  }, [allTokens, query, sortData, isCommunityListEnabled]);

  const noTokensFound = query && tokens.length === 0;

  return (
    <BoxPanel bg="bg2" mt="50px">
      <Flex justifyContent="space-between" flexWrap="wrap" mb="5px">
        <Typography variant="h2" mr={2} mb={4}>
          <Trans>Tokens</Trans>
        </Typography>
        <Box width={isSmallScreen ? '100%' : '295px'} mb={isSmallScreen ? '25px' : 0}>
          <SearchWrap>
            <SearchInput value={query} onChange={e => setQuery(e.target.value)} />
            <CancelSearchButton isActive={query.length > 0} onClick={() => setQuery('')}></CancelSearchButton>
          </SearchWrap>
        </Box>
      </Flex>
      <Box overflow="auto">
        <List>
          {!noTokensFound && (
            <Grid>
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
                className={sortBy.key === 'liquidity' ? sortBy.order : ''}
                onClick={() =>
                  handleSortSelect({
                    key: 'liquidity',
                  })
                }
              >
                Liquidity
              </HeaderText>
              <Flex>
                <QuestionWrapper style={{ transform: 'translate3d(-5px, 1px, 0)' }}>
                  <QuestionHelper
                    width={290}
                    text={
                      <Typography color="text1">
                        <Trans>
                          To protect liquidity, many assets include a withdrawal limit that resets over 24 hours.
                        </Trans>
                      </Typography>
                    }
                  />
                </QuestionWrapper>
                <HeaderText style={{ cursor: 'default' }}>Available</HeaderText>
              </Flex>
              <HeaderText style={{ cursor: 'default' }}>7d trend</HeaderText>
            </Grid>
          )}

          {tokens ? (
            <>
              {tokens.map((token, index, arr) =>
                showingExpanded || index < COMPACT_ITEM_COUNT ? (
                  <TokenItem
                    key={token.symbol}
                    price={prices?.[token.symbol]}
                    token={token}
                    isLast={index === arr.length - 1 || (!showingExpanded && index === COMPACT_ITEM_COUNT - 1)}
                  />
                ) : null,
              )}
              {noTokensFound && (
                <Typography
                  width="100%"
                  paddingTop="30px"
                  paddingBottom="15px"
                  fontSize={16}
                  color="text"
                  textAlign="center"
                >
                  Couldn't find any listings for <strong>{query}</strong>.
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
        <Box>
          <DropdownLink expanded={showingExpanded} setExpanded={setShowingExpanded} />
        </Box>
      )}
    </BoxPanel>
  );
};

export default TokenList;
