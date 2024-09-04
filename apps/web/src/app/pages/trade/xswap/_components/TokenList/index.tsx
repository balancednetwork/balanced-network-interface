import React from 'react';

import { Trans } from '@lingui/macro';
import { useMedia } from 'react-use';
import { Box, Flex } from 'rebass';
import styled, { useTheme } from 'styled-components';

import Divider from '@/app/components/Divider';
import DropdownLink from '@/app/components/DropdownLink';
import { HeaderText } from '@/app/components/HeaderText';
import { BoxPanel } from '@/app/components/Panel';
import QuestionHelper, { QuestionWrapper } from '@/app/components/QuestionHelper';
import SearchInput from '@/app/components/SearchModal/SearchInput';
import { Typography } from '@/app/theme';
import { COMBINED_TOKENS_MAP_BY_ADDRESS } from '@/constants/tokens';
import useSort from '@/hooks/useSort';
import { TokenStats, useAllTokensByAddress } from '@/queries/backendv2';
import { useTokenListConfig } from '@/store/lists/hooks';
import { getSupportedXChainForToken } from '@/xwagmi/xcall/utils';
import SkeletonTokenPlaceholder from './SkeletonTokenPlaceholder';
import TokenItem from './TokenItem';

const COMPACT_ITEM_COUNT = 8;

const List = styled.div`
  -webkit-overflow-scrolling: touch;
  min-width: 840px;
  overflow: hidden;
`;

export const Grid = styled.div`
  display: grid;
  margin: 20px 0;
  gap: 1em;
  align-items: center;
  grid-template-columns: 6fr 5fr 6fr 5fr 7fr;
  ${({ theme }) => theme.mediaWidth.upLarge`
    grid-template-columns: 25fr 14fr 15fr 14fr 15fr;
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

  const tokens = React.useMemo(() => {
    if (!allTokens) return [];
    const filteredTokens = Object.values(allTokens).filter((token: TokenStats) => {
      const shouldShow = isCommunityListEnabled || token.type === 'balanced';
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
          <SearchInput value={query} onChange={e => setQuery(e.target.value)} />
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
              <Flex>
                <QuestionWrapper style={{ transform: 'translate3d(-5px, 1px, 0)' }}>
                  <QuestionHelper
                    width={275}
                    text={
                      <>
                        <Typography color="text1">
                          <Trans>
                            Based on the amount of tokens that have interacted with Balanced and/or the ICON blockchain.
                          </Trans>
                        </Typography>
                        <Typography color="text1" mt={2}>
                          <Trans>It does not reflect the total market cap for multi-chain assets.</Trans>
                        </Typography>
                      </>
                    }
                  />
                </QuestionWrapper>
                <HeaderText
                  role="button"
                  className={sortBy.key === 'market_cap' ? sortBy.order : ''}
                  onClick={() =>
                    handleSortSelect({
                      key: 'market_cap',
                    })
                  }
                >
                  MARKET CAP
                </HeaderText>
              </Flex>
              <HeaderText
                role="button"
                className={sortBy.key === 'liquidity' ? sortBy.order : ''}
                onClick={() =>
                  handleSortSelect({
                    key: 'liquidity',
                  })
                }
              >
                Available
              </HeaderText>
              <HeaderText style={{ cursor: 'default' }}>7d trend</HeaderText>
            </Grid>
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
