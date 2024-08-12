import React, { useCallback, useMemo, useState } from 'react';

import { Pair, useAllPairsIncentivisedById, useAllPairsTotal } from '@/queries/backendv2';
import { isMobile } from 'react-device-detect';
import { useMedia } from 'react-use';
import { Flex, Box, Text } from 'rebass/styled-components';
import styled from 'styled-components';

import QuestionIcon from '@/assets/icons/question.svg';
import SigmaIcon from '@/assets/icons/sigma.svg';
import Divider from '@/components/Divider';
import DropdownLink from '@/components/DropdownLink';
import { BoxPanel } from '@/components/Panel';
import SearchInput from '@/components/SearchInput';
import PoolLogo, { IconWrapper, PoolLogoWrapper } from '@/components/shared/PoolLogo';
import { MouseoverTooltip } from '@/components/Tooltip';
import useSort from '@/hooks/useSort';
import { Typography } from '@/theme';
import { getFormattedNumber } from '@/utils/formatter';

import { COMPACT_ITEM_COUNT, HeaderText, StyledSkeleton as Skeleton } from './TokenSection';

export const MAX_BOOST = 2.5;

const List = styled(Box)`
  -webkit-overflow-scrolling: touch;
  min-width: 1100px;
  overflow: hidden;
`;

const DashGrid = styled(Box)`
  display: grid;
  gap: 1em;
  align-items: center;
  grid-template-columns: 2fr repeat(4, 1fr);
  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-template-columns: 1.2fr 0.5fr repeat(3, 1fr);
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

  &.apy-column {
    padding: 10px 0;
    flex-direction: column;
    align-items: flex-end;
    min-width: 190px;
  }
`;

const FooterText = styled(DataText)`
  font-weight: bold;
`;

const APYItem = styled(Flex)`
  align-items: flex-end;
  line-height: 25px;
`;

const StyledSkeleton = styled(Skeleton)`
  &.pool-icon-skeleton {
    position: absolute;
    left: 0;

    &:last-of-type {
      left: 38px;
    }
  }
`;

const QuestionWrapper = styled(Box)`
  width: 0;
  margin: 0 5px;
  overflow: hidden;
  display: inline;
`;

function TotalIcon() {
  return (
    <PoolLogoWrapper>
      <IconWrapper></IconWrapper>
      <IconWrapper ml="-38px"></IconWrapper>
      <IconWrapper ml="-38px"></IconWrapper>
      <IconWrapper ml="-38px"></IconWrapper>
      <IconWrapper ml="-38px">
        <SigmaIcon width={20} height={20} />
      </IconWrapper>
    </PoolLogoWrapper>
  );
}

const SkeletonPairPlaceholder = () => {
  return (
    <DashGrid my={2}>
      <DataText>
        <Flex alignItems="center">
          <Box sx={{ minWidth: '95px', minHeight: '48px', position: 'relative' }}>
            <StyledSkeleton variant="circle" width={48} height={48} className="pool-icon-skeleton" />
            <StyledSkeleton variant="circle" width={48} height={48} className="pool-icon-skeleton" />
          </Box>
          <Text ml={2}>
            <StyledSkeleton width={90} />
          </Text>
        </Flex>
      </DataText>
      <DataText>
        <StyledSkeleton width={50} />
      </DataText>
      <DataText>
        <StyledSkeleton width={100} />
      </DataText>
      <DataText>
        <StyledSkeleton width={100} />
      </DataText>
      <DataText>
        <StyledSkeleton width={70} />
      </DataText>
    </DashGrid>
  );
};

const PairItem = ({
  pair: { id, name, baseAddress, quoteAddress, liquidity, fees24h, fees30d, volume24h, volume30d, feesApy, balnApy },
  isLast,
}: {
  pair: Pair;
  isLast: boolean;
}) => (
  <>
    <DashGrid my={2}>
      <DataText minWidth={'220px'}>
        <Flex alignItems="center">
          <Box sx={{ minWidth: '95px' }}>
            <PoolLogo baseCurrency={baseAddress} quoteCurrency={quoteAddress} />
          </Box>
          <Text ml={2}>{name.replace('/', ' / ')}</Text>
        </Flex>
      </DataText>
      <DataText className="apy-column">
        {' '}
        {balnApy ? (
          liquidity < 1000 ? null : (
            <APYItem>
              <Typography color="#d5d7db" fontSize={14} marginRight={'5px'}>
                BALN:
              </Typography>
              {`${getFormattedNumber(balnApy, 'percent2')} - ${getFormattedNumber(balnApy * MAX_BOOST, 'percent2')}`}
            </APYItem>
          )
        ) : null}
        {feesApy !== 0 ? (
          liquidity < 1000 ? (
            '–'
          ) : (
            <APYItem>
              <Typography color="#d5d7db" fontSize={14} marginRight={'5px'}>
                Fees:
              </Typography>
              {getFormattedNumber(feesApy, 'percent2')}
            </APYItem>
          )
        ) : null}
      </DataText>
      <DataText>{getFormattedNumber(liquidity, 'currency0')}</DataText>
      <DataText>{volume24h ? getFormattedNumber(volume24h, 'currency0') : '-'}</DataText>
      <DataText>{fees24h ? getFormattedNumber(fees24h, 'currency0') : '-'}</DataText>
    </DashGrid>
    <Divider />
  </>
);

export default function PairSection() {
  const { data: allPairs } = useAllPairsIncentivisedById();
  const { data: pairsTotal } = useAllPairsTotal();
  const { sortBy, handleSortSelect, sortData } = useSort({ key: 'liquidity', order: 'DESC' });
  const [showingExpanded, setShowingExpanded] = useState(false);
  const [searched, setSearched] = useState('');

  const pairs = useMemo(() => {
    if (!allPairs) return [];
    const filteredTokens = Object.values(allPairs).filter(pair => {
      const tokenName = pair.name.toLowerCase();
      const search = searched.toLowerCase();
      return tokenName.includes(search);
    });
    return sortData(filteredTokens);
  }, [allPairs, searched, sortData]);

  const noPairsFound = searched && pairs.length === 0;
  const isSmallScreen = useMedia('(max-width: 800px)');

  const handleSearch = useCallback(
    e => {
      setShowingExpanded(!!e.target.value);
      setSearched(e.target.value);
    },
    [setSearched, setShowingExpanded],
  );

  const dynamicTotals = useMemo(() => {
    if (pairs) {
      return {
        tvl: pairs.reduce((acc, pair) => acc + pair.liquidity, 0),
        volume: pairs.reduce((acc, pair) => acc + pair.volume24h, 0),
        fees: pairs.reduce((acc, pair) => acc + pair.fees24h, 0),
      };
    }
  }, [pairs]);

  return (
    <BoxPanel bg="bg2" id="exchange">
      <Flex justifyContent="space-between" flexWrap="wrap">
        <Typography variant="h2" mb={5} mr="20px">
          Exchange
        </Typography>
        {!isSmallScreen && (
          <Box width="295px">
            <SearchInput value={searched} onChange={handleSearch} />
          </Box>
        )}
      </Flex>

      {isSmallScreen && (
        <Box mb="25px">
          <SearchInput value={searched} onChange={handleSearch} />
        </Box>
      )}
      <Box overflow="auto">
        <List>
          {!noPairsFound && (
            <DashGrid>
              <HeaderText
                minWidth={'220px'}
                role="button"
                className={sortBy.key === 'name' ? sortBy.order : ''}
                onClick={() =>
                  handleSortSelect({
                    key: 'name',
                  })
                }
              >
                <span>POOL</span>
              </HeaderText>
              <HeaderText
                minWidth={'190px'}
                role="button"
                className={sortBy.key === 'apyTotal' ? sortBy.order : ''}
                onClick={() =>
                  handleSortSelect({
                    key: 'apyTotal',
                  })
                }
              >
                {!isMobile && (
                  <MouseoverTooltip
                    width={330}
                    text={
                      <>
                        <Typography>
                          The BALN APR is calculated from the USD value of BALN rewards allocated to a pool. Your rate
                          will vary based on the amount of bBALN you hold.
                        </Typography>
                        <Typography marginTop={'20px'}>
                          The fee APR is calculated from the swap fees earned by a pool in the last 30 days.
                        </Typography>
                      </>
                    }
                    placement="top"
                  >
                    <QuestionWrapper onClick={e => e.stopPropagation()}>
                      <QuestionIcon className="header-tooltip" width={14} />
                    </QuestionWrapper>
                  </MouseoverTooltip>
                )}
                APR
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
                role="button"
                className={sortBy.key === 'volume24h' ? sortBy.order : ''}
                onClick={() =>
                  handleSortSelect({
                    key: 'volume24h',
                  })
                }
              >
                VOLUME (24H)
              </HeaderText>
              <HeaderText
                role="button"
                className={sortBy.key === 'fees24h' ? sortBy.order : ''}
                onClick={() =>
                  handleSortSelect({
                    key: 'fees24h',
                  })
                }
              >
                FEES (24H)
              </HeaderText>
            </DashGrid>
          )}

          {pairs ? (
            <>
              {pairs.map((pair, index, arr) =>
                showingExpanded || index < COMPACT_ITEM_COUNT ? (
                  <PairItem
                    key={pair.name}
                    isLast={index === arr.length - 1 || (!showingExpanded && index === COMPACT_ITEM_COUNT - 1)}
                    pair={pair}
                  />
                ) : null,
              )}
              {noPairsFound && (
                <Typography width="100%" paddingTop="30px" fontSize={16} color="text">
                  Couldn't find any listings for <strong>{searched}</strong>.
                </Typography>
              )}
            </>
          ) : (
            <>
              <SkeletonPairPlaceholder />
              <Divider />
              <SkeletonPairPlaceholder />
              <Divider />
              <SkeletonPairPlaceholder />
              <Divider />
              <SkeletonPairPlaceholder />
              <Divider />
              <SkeletonPairPlaceholder />
            </>
          )}
          {pairsTotal && !noPairsFound && (
            <DashGrid my={2}>
              <FooterText minWidth={'220px'}>
                <Flex alignItems="center">
                  <Box sx={{ minWidth: '95px' }}>
                    <TotalIcon />
                  </Box>
                  <Text ml={2}>{searched ? 'Total' : 'All pools'} </Text>
                </Flex>
              </FooterText>
              <FooterText minWidth={'190px'}>–</FooterText>
              <FooterText>{getFormattedNumber(searched ? dynamicTotals?.tvl : pairsTotal.tvl, 'currency0')}</FooterText>
              <FooterText>
                {getFormattedNumber(searched ? dynamicTotals?.volume : pairsTotal.volume, 'currency0')}
              </FooterText>
              <FooterText>
                {getFormattedNumber(searched ? dynamicTotals?.fees : pairsTotal.fees, 'currency0')}
              </FooterText>
            </DashGrid>
          )}
        </List>
      </Box>

      {pairs.length > COMPACT_ITEM_COUNT && (
        <Box pb="3px">
          <DropdownLink expanded={showingExpanded} setExpanded={setShowingExpanded} />
        </Box>
      )}
    </BoxPanel>
  );
}
