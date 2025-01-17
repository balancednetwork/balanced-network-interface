import React, { useMemo } from 'react';

import { Trans, t } from '@lingui/macro';
import { Box, Flex, Text } from 'rebass/styled-components';
import styled from 'styled-components';

import Divider from '@/app/components/Divider';
import PoolLogo from '@/app/components/PoolLogo';
import { MouseoverTooltip } from '@/app/components/Tooltip';
import { Typography } from '@/app/theme';
import QuestionIcon from '@/assets/icons/question.svg';
import useSort from '@/hooks/useSort';
import { MIN_LIQUIDITY_TO_INCLUDE, PairData, TOKEN_BLACKLIST, useAllPairsById, useNOLPools } from '@/queries/backendv2';
import { useDerivedMintInfo, useMintActionHandlers } from '@/store/mint/hooks';
import { Field } from '@/store/mint/reducer';
import { formatSymbol, formatValue, getFormattedNumber } from '@/utils/formatter';

import DropdownLink from '@/app/components/DropdownLink';
import RewardsDisplay from '@/app/components/RewardsDisplay/RewardsDisplay';
import { HeaderText } from '@/app/components/SearchModal/styleds';
import Skeleton from '@/app/components/Skeleton';
import { MAX_BOOST } from '@/app/components/home/BBaln/utils';
import { NETWORK_ID } from '@/constants/config';
import { useRatesWithOracle } from '@/queries/reward';
import { PairInfo } from '@/types';
import { xChainMap } from '@balancednetwork/xwagmi';
import { useMedia } from 'react-use';
import { getRewardApr } from './utils';

const COMPACT_ITEM_COUNT = 8;

const List = styled(Box)`
  -webkit-overflow-scrolling: touch;
  min-width: 930px;
  overflow: hidden;
`;

const DashGrid = styled(Box)`
  display: grid;
  gap: 1em;
  align-items: center;
  grid-template-columns: 1.8fr 1.3fr 1fr 1.1fr 0.9fr;

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

const PairGrid = styled(DashGrid)`
  cursor: pointer;
  grid-template-columns: 1.6fr 1.6fr 1fr 1.1fr 0.9fr;
  &:hover {
    & > div {
      p,
      & > div {
        color: ${({ theme }) => theme.colors.primary} !important;
        path {
          stroke: ${({ theme }) => theme.colors.primary} !important;
        }
      }
    }

    > ${DataText} {
      color: ${({ theme }) => theme.colors.primary};
    }
  }
`;

const StyledSkeleton = styled(Skeleton)`
  background-color: rgba(44, 169, 183, 0.2) !important;
  &.pool-icon-skeleton {
    position: absolute;
    left: 0;

    &:last-of-type {
      left: 38px;
    }
  }
`;

export const APYItem = styled(Flex)`
  align-items: flex-end;
  line-height: 25px;
`;

const QuestionWrapper = styled(Box)`
  margin: 0 5px 0 5px;
`;

const TooltipWrapper = styled.span`
  display: inline-block;
  line-height: 0.8;
`;

const SkeletonPairPlaceholder = () => {
  return (
    <DashGrid my={2}>
      <DataText>
        <Flex alignItems="center">
          <Box sx={{ minWidth: '95px', minHeight: '48px', position: 'relative' }}>
            <StyledSkeleton variant="circle" width={48} className="pool-icon-skeleton" />
            <StyledSkeleton variant="circle" width={48} className="pool-icon-skeleton" />
          </Box>
          <Text ml={2}>
            <Skeleton width={90} />
          </Text>
        </Flex>
      </DataText>
      <DataText>
        <Skeleton width={50} />
      </DataText>
      <DataText>
        <Skeleton width={100} />
      </DataText>
      <DataText>
        <Skeleton width={100} />
      </DataText>
      <DataText>
        <Skeleton width={70} />
      </DataText>
    </DashGrid>
  );
};

type PairItemProps = {
  pair: PairData;
  onClick: (pair: PairInfo) => void;
  isLast: boolean;
};

const PairItem = ({ pair, onClick, isLast }: PairItemProps) => {
  const prices = useRatesWithOracle();
  const pairName =
    pair.info.id === 1
      ? t`ICX queue`
      : `${formatSymbol(pair.info.baseCurrencyKey)} / ${formatSymbol(pair.info.quoteCurrencyKey)}`;

  return (
    <>
      <PairGrid my={2} onClick={() => onClick(pair.info)}>
        <DataText>
          <Flex alignItems="center">
            <Box sx={{ minWidth: '95px' }}>
              <PoolLogo baseCurrency={pair.info.baseToken} quoteCurrency={pair.info.quoteToken} />
            </Box>
            <Text ml={2}>{pairName}</Text>
          </Flex>
        </DataText>
        <DataText>
          <Flex flexDirection="column" py={2} alignItems="flex-end">
            <RewardsDisplay pair={pair} />
            {pair.feesApy !== 0 ? (
              <APYItem>
                <Typography color="#d5d7db" fontSize={14} marginRight={'5px'}>
                  <Trans>Fees:</Trans>
                </Typography>
                {getFormattedNumber(pair.feesApy, 'percent2')}
              </APYItem>
            ) : null}
            {!pair.feesApy && !pair.balnApy && '-'}
          </Flex>
        </DataText>
        <DataText>{getFormattedNumber(pair.liquidity, 'currency0')}</DataText>
        <DataText>{pair.volume24h ? getFormattedNumber(pair.volume24h, 'currency0') : '-'}</DataText>
        <DataText>{pair.fees24h ? getFormattedNumber(pair.fees24h, 'currency0') : '-'}</DataText>
      </PairGrid>
      {!isLast && <Divider />}
    </>
  );
};

export default function AllPoolsPanel({ query }: { query: string }) {
  const { data: allPairs } = useAllPairsById();
  const { data: nolPairs } = useNOLPools();
  const { sortBy, handleSortSelect, sortData } = useSort({ key: 'apyTotal', order: 'DESC' });
  const { noLiquidity } = useDerivedMintInfo();
  const { onCurrencySelection } = useMintActionHandlers(noLiquidity);
  const showAPRTooltip = useMedia('(min-width: 700px)');
  const [showingExpanded, setShowingExpanded] = React.useState(false);

  const handlePoolLick = (pair: PairInfo) => {
    if (pair.id === 1) {
      onCurrencySelection(Field.CURRENCY_A, pair.quoteToken);
    } else {
      onCurrencySelection(Field.CURRENCY_A, pair.baseToken);
      onCurrencySelection(Field.CURRENCY_B, pair.quoteToken);
    }
  };

  //show only incentivised, cross native or NOL pairs
  const relevantPairs = useMemo(() => {
    //TEMPORARY LISBON
    if (allPairs && NETWORK_ID !== 1) return Object.values(allPairs);
    //END OF TEMPORARY LISBON

    if (!allPairs || !nolPairs) return [];
    const nativeSymbols = Object.values(xChainMap).map(chain => chain.nativeCurrency.symbol);
    nativeSymbols.push('wICX');

    return Object.values(allPairs).filter(pair => {
      const isTokenBlacklisted = TOKEN_BLACKLIST.some(
        token => token === pair.info.baseCurrencyKey || token === pair.info.quoteCurrencyKey,
      );
      return (
        !isTokenBlacklisted &&
        (pair.balnApy ||
          pair.externalRewards?.length ||
          nolPairs.includes(pair.info.id) ||
          nativeSymbols.includes(pair.info.baseCurrencyKey))
      );
    });
  }, [allPairs, nolPairs]);

  const filteredRelevantPairs = useMemo(() => {
    if (!query) return relevantPairs;

    return relevantPairs.filter(pair => {
      //show network owned liquidity
      if (query === 'nol' && nolPairs) {
        return nolPairs.includes(pair.info.id);
      }
      //show pair with crosschain native token
      if (query === 'native') {
        return Object.values(xChainMap)
          .map(chain => chain.nativeCurrency.symbol)
          .includes(pair.info.baseCurrencyKey);
      }
      return (
        pair.info.baseCurrencyKey.toLowerCase().includes(query.toLowerCase()) ||
        pair.info.quoteCurrencyKey.toLowerCase().includes(query.toLowerCase())
      );
    });
  }, [relevantPairs, query, nolPairs]);

  return (
    <Box overflow="auto">
      <List>
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
            <span>
              <Trans>POOL</Trans>
            </span>
          </HeaderText>
          <HeaderText
            role="button"
            className={sortBy.key === 'apyTotal' ? sortBy.order : ''}
            onClick={() =>
              handleSortSelect({
                key: 'apyTotal',
              })
            }
          >
            {showAPRTooltip && (
              <TooltipWrapper onClick={e => e.stopPropagation()}>
                <MouseoverTooltip
                  width={330}
                  text={
                    <>
                      <Trans>
                        Based on the USD value of liquidity rewards (claimable from the Home page) and fees earned by a
                        pool over the past 30 days.
                      </Trans>
                      <br />
                      <br />
                      <Trans>BALN rewards depend on your position size and bBALN holdings.</Trans>
                    </>
                  }
                  placement="top"
                  strategy="absolute"
                >
                  <QuestionWrapper>
                    <QuestionIcon className="header-tooltip" width={14} />
                  </QuestionWrapper>
                </MouseoverTooltip>
              </TooltipWrapper>
            )}
            <Trans>APR</Trans>
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
            <Trans>LIQUIDITY</Trans>
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
            <Trans>VOLUME (24H)</Trans>
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
            <Trans>FEES (24H)</Trans>
          </HeaderText>
        </DashGrid>

        {filteredRelevantPairs ? (
          sortData(filteredRelevantPairs).map((pair, index, array) =>
            showingExpanded || index < COMPACT_ITEM_COUNT ? (
              <PairItem
                key={index}
                pair={pair}
                onClick={handlePoolLick}
                isLast={index === array.length - 1 || (!showingExpanded && index === COMPACT_ITEM_COUNT - 1)}
              />
            ) : null,
          )
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
            <Divider />
            <SkeletonPairPlaceholder />
            <Divider />
            <SkeletonPairPlaceholder />
          </>
        )}

        {filteredRelevantPairs.length === 0 && query && (
          <Typography textAlign="center" mt={'30px'}>
            <Trans>No pools found.</Trans>
          </Typography>
        )}

        {filteredRelevantPairs.length > COMPACT_ITEM_COUNT && (
          <Box>
            <DropdownLink expanded={showingExpanded} setExpanded={setShowingExpanded} />
          </Box>
        )}
      </List>
    </Box>
  );
}
