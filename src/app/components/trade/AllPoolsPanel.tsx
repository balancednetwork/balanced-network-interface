import React from 'react';

import { Skeleton } from '@material-ui/lab';
import { motion } from 'framer-motion';
import { Flex, Box, Text } from 'rebass/styled-components';
import styled, { css } from 'styled-components';

import Divider from 'app/components/Divider';
import PoolLogo from 'app/components/PoolLogo';
import { PairInfo } from 'constants/pairs';
import useSort from 'hooks/useSort';
import { useAllPairs } from 'queries/reward';
import { getFormattedNumber } from 'utils/formatter';

const List = styled(Box)`
  -webkit-overflow-scrolling: touch;
  min-width: 930px;
  overflow: hidden;
`;

const DashGrid = styled(Box)`
  display: grid;
  gap: 1em;
  align-items: center;
  grid-template-columns: 2fr repeat(4, 1fr);
  ${({ theme }) => theme.mediaWidth.upLarge`
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

type PairItemProps = {
  pair: PairInfo & {
    tvl: number;
    apy: number;
    participant: number;
    volume: number;
    fees: number;
  };
};

const PairItem = ({ pair }: PairItemProps) => (
  <>
    <DashGrid my={2}>
      <DataText>
        <Flex alignItems="center">
          <Box sx={{ minWidth: '95px' }}>
            <PoolLogo baseCurrency={pair.baseToken} quoteCurrency={pair.quoteToken} />
          </Box>
          <Text ml={2}>{`${pair.baseCurrencyKey} / ${pair.quoteCurrencyKey}`}</Text>
        </Flex>
      </DataText>
      <DataText>{pair.apy ? getFormattedNumber(pair.apy, 'percent2') : '-'}</DataText>
      <DataText>{getFormattedNumber(pair.tvl, 'currency0')}</DataText>
      <DataText>{pair.volume ? getFormattedNumber(pair.volume, 'currency0') : '-'}</DataText>
      <DataText>{pair.fees ? getFormattedNumber(pair.fees, 'currency0') : '-'}</DataText>
    </DashGrid>
    <Divider />
  </>
);

export default function PairSection() {
  const allPairs = useAllPairs();
  const { sortBy, handleSortSelect, sortData } = useSort({ key: 'apy', order: 'DESC' });

  return (
    <Box overflow="auto">
      <List>
        <DashGrid>
          <HeaderText
            role="button"
            className={sortBy.key === 'baseCurrencyKey' ? sortBy.order : ''}
            onClick={() =>
              handleSortSelect({
                key: 'baseCurrencyKey',
              })
            }
          >
            <span>POOL</span>
          </HeaderText>
          <HeaderText
            role="button"
            className={sortBy.key === 'apy' ? sortBy.order : ''}
            onClick={() =>
              handleSortSelect({
                key: 'apy',
              })
            }
          >
            APY
          </HeaderText>
          <HeaderText
            role="button"
            className={sortBy.key === 'tvl' ? sortBy.order : ''}
            onClick={() =>
              handleSortSelect({
                key: 'tvl',
              })
            }
          >
            LIQUIDITY
          </HeaderText>
          <HeaderText
            role="button"
            className={sortBy.key === 'volume' ? sortBy.order : ''}
            onClick={() =>
              handleSortSelect({
                key: 'volume',
              })
            }
          >
            VOLUME (24H)
          </HeaderText>
          <HeaderText
            role="button"
            className={sortBy.key === 'fees' ? sortBy.order : ''}
            onClick={() =>
              handleSortSelect({
                key: 'fees',
              })
            }
          >
            FEES (24H)
          </HeaderText>
        </DashGrid>

        {allPairs ? (
          sortData(Object.values(allPairs)).map(pair => (
            <motion.div key={`${pair.baseCurrencyKey}${pair.quoteCurrencyKey}`} layout>
              <PairItem pair={pair} />
            </motion.div>
          ))
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
      </List>
    </Box>
  );
}
