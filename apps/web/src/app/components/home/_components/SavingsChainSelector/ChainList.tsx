import React, { useMemo, useState } from 'react';

import { Box, Flex } from 'rebass';

import { ChainLogo } from '@/app/components/ChainLogo';
import SearchInput from '@/app/components/SearchModal/SearchInput';
import { HeaderText } from '@/app/components/SearchModal/styleds';
import { Typography } from '@/app/theme';
import { useSignedInWallets } from '@/hooks/useWallets';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { XChainId, XToken } from '@balancednetwork/xwagmi';
import { Trans, t } from '@lingui/macro';
import { isMobile } from 'react-device-detect';
import { useMedia } from 'react-use';
import styled from 'styled-components';
import { ChainItemWrap, SelectorWrap } from '../LoanChainSelector/styledComponents';

export const Grid = styled(Box)<{ $isSignedIn?: boolean }>`
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr;
  width: 100%;
  align-items: center;
  padding: 8px 0;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text};

  &:hover {
  color: ${({ theme }) => theme.colors.primaryBright};
  }
`;

export const StyledHeaderText = styled(HeaderText)`
  font-size: 12px;
  @media (max-width: 440px) {
    font-size: 10px;
  }
`;

export const ScrollHelper = styled(Box)<{ $height?: string }>`
  max-height: ${({ $height }) => ($height ? $height : '280px')}; 
  overflow: auto; 
  padding: 0 20px;
  margin: 15px -20px 0 !important;

  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
`;

type ChainListProps = {
  chainId: XChainId;
  setChainId: (chain: XChainId) => void;
  rows: any[];
  width: number | undefined;
};

type ChainItemProps = {
  chain: any;
  isActive: boolean;
  isLast: boolean;
  setChainId: (chain: XChainId) => void;
};

const ChainItem = ({ chain, setChainId, isLast }: ChainItemProps) => {
  const signedInWallets = useSignedInWallets();
  const isSignedIn = signedInWallets.some(wallet => wallet.xChainId === chain.xChainId);
  const isSmall = useMedia('(max-width: 440px)');
  return (
    <Grid $isSignedIn={isSignedIn} className={isLast ? '' : 'border-bottom'} onClick={e => setChainId(chain.xChainId)}>
      <ChainItemWrap>
        <Box pr="10px">
          <ChainLogo chain={chain} />
        </Box>
        <Flex flexDirection={isSmall ? 'column' : 'row'} alignItems={'start'}>
          <Typography fontWeight="bold" fontSize={isSmall ? 12 : 14} color="inherit" mr={'6px'}>
            {chain.name}
            <span style={{ fontWeight: 'normal' }}></span>
          </Typography>
        </Flex>
      </ChainItemWrap>
      {chain.lockedAmount.gt(0) ? (
        <Typography
          color="inherit"
          style={{ transition: 'all ease 0.3s', opacity: chain.lockedAmount.gt(0) ? 1 : 0.75 }}
          fontSize={isSmall ? 12 : chain.lockedAmount.gt(0) ? 14 : 12}
          textAlign="right"
        >
          ${chain.lockedAmount.toFixed(2)}
        </Typography>
      ) : (
        <>
          {chain.bnUSDBalance?.greaterThan(1) ? (
            <Typography
              color="inherit"
              style={{
                transition: 'all ease 0.3s',
                opacity: chain.bnUSDBalance.greaterThan(1) ? 1 : 0.75,
              }}
              fontSize={isSmall ? 10 : chain.bnUSDBalance.greaterThan(1) ? 12 : 10}
              textAlign="right"
            >
              ${chain.bnUSDBalance.toFixed(2)} available
            </Typography>
          ) : (
            <Typography textAlign="right">-</Typography>
          )}
        </>
      )}
      {chain.rewardAmount.gte(0) ? (
        <Typography
          color="inherit"
          style={{ transition: 'all ease 0.3s', opacity: chain.rewardAmount.gte(0) ? 1 : 0.75 }}
          fontSize={isSmall ? 12 : chain.rewardAmount.gte(0) ? 14 : 12}
          textAlign="right"
        >
          {chain.rewardAmount.gt(0.01) ? `$${chain.rewardAmount.toFixed(2)}` : 'Pending'}
        </Typography>
      ) : (
        <Typography textAlign="right">-</Typography>
      )}
    </Grid>
  );
};

const compareCurrencyAmount = (a: CurrencyAmount<XToken> | undefined, b: CurrencyAmount<XToken> | undefined) => {
  if (!a && !b) return 0;
  if (!a) return -1;
  if (!b) return 1;
  return a.equalTo(b) ? 0 : a.lessThan(b) ? -1 : 1;
};

const ChainList = ({ chainId, setChainId, rows, width }: ChainListProps) => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [sortBy, setSortBy] = useState<{ key: string; order: 'ASC' | 'DESC' }>({ key: 'savings', order: 'DESC' });

  const filteredRows = React.useMemo(() => {
    if (searchQuery === '') return rows;

    return rows.filter(
      row =>
        row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.xChainId.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [rows, searchQuery]);

  const sortedRows = useMemo(() => {
    return filteredRows.sort((a, b) => {
      if (sortBy.key === 'name') {
        return sortBy.order === 'ASC' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      if (sortBy.key === 'savings') {
        return sortBy.order === 'ASC'
          ? a.lockedAmount.comparedTo(b.lockedAmount) ||
              compareCurrencyAmount(a.bnUSDBalance, b.bnUSDBalance) ||
              a.rewardAmount.comparedTo(b.rewardAmount) ||
              b.name.localeCompare(a.name)
          : b.lockedAmount.comparedTo(a.lockedAmount) ||
              compareCurrencyAmount(b.bnUSDBalance, a.bnUSDBalance) ||
              b.rewardAmount.comparedTo(a.rewardAmount) ||
              a.name.localeCompare(b.name);
      }
      if (sortBy.key === 'rewards') {
        return sortBy.order === 'ASC'
          ? a.rewardAmount.comparedTo(b.rewardAmount) ||
              a.lockedAmount.comparedTo(b.lockedAmount) ||
              compareCurrencyAmount(a.bnUSDBalance, b.bnUSDBalance) ||
              b.name.localeCompare(a.name)
          : b.rewardAmount.comparedTo(a.rewardAmount) ||
              b.lockedAmount.comparedTo(a.lockedAmount) ||
              compareCurrencyAmount(b.bnUSDBalance, a.bnUSDBalance) ||
              a.name.localeCompare(b.name);
      }

      return 0;
    });
  }, [filteredRows, sortBy]);

  const handleSortSelect = (key: string, defaultOrder: 'ASC' | 'DESC' = 'ASC') => {
    if (sortBy.key === key) {
      setSortBy({ key, order: sortBy.order === 'ASC' ? 'DESC' : 'ASC' });
    } else {
      setSortBy({ key, order: defaultOrder });
    }
  };

  return (
    <SelectorWrap $width={width}>
      <SearchInput
        type="text"
        placeholder={t`Search blockchains...`}
        autoComplete="off"
        value={searchQuery}
        tabIndex={isMobile ? -1 : 1}
        onChange={e => {
          setSearchQuery(e.target.value);
        }}
      />
      <ScrollHelper>
        <Grid>
          <StyledHeaderText
            role="button"
            className={sortBy.key === 'name' ? sortBy.order : ''}
            onClick={() => handleSortSelect('name')}
          >
            <span>
              <Trans>Blockchain</Trans>
            </span>
          </StyledHeaderText>
          <StyledHeaderText
            role="button"
            className={sortBy.key === 'savings' ? sortBy.order : ''}
            onClick={() => handleSortSelect('savings', 'DESC')}
          >
            <span style={{ textAlign: 'right', width: '100%' }}>
              <Trans>Savings</Trans>
            </span>
          </StyledHeaderText>
          <StyledHeaderText
            role="button"
            className={sortBy.key === 'rewards' ? sortBy.order : ''}
            onClick={() => handleSortSelect('rewards', 'DESC')}
          >
            <span style={{ textAlign: 'right', width: '100%' }}>
              <Trans>Rewards</Trans>
            </span>
          </StyledHeaderText>
        </Grid>
        {sortedRows.map((chainItem, index) => (
          <Box key={chainItem.xChainId}>
            <ChainItem
              chain={chainItem}
              isActive={chainId === chainItem.xChainId}
              isLast={sortedRows.length === index + 1}
              setChainId={setChainId}
            />
          </Box>
        ))}
        {sortedRows.length === 0 && searchQuery !== '' && (
          <Typography textAlign="center" mt="20px" pb="22px">
            No blockchains found.
          </Typography>
        )}
      </ScrollHelper>
    </SelectorWrap>
  );
};

export default ChainList;
