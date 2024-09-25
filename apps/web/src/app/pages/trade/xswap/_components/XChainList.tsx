import React from 'react';

import { Box, Flex } from 'rebass';
import styled from 'styled-components';

import { HeaderText } from '@/app/components/HeaderText';
import SearchInput from '@/app/components/SearchModal/SearchInput';
import { ChainLogo } from '@/app/components2/ChainLogo';
import { Typography } from '@/app/theme';
import useSortXChains from '@/hooks/useSortXChains';
import { useHasSignedIn } from '@/hooks/useWallets';
import { useRatesWithOracle } from '@/queries/reward';
import { useWalletBalances } from '@/store/wallet/hooks';
import { formatValue } from '@/utils/formatter';
import { xChains } from '@/xwagmi/constants/xChains';
import { XChain } from '@/xwagmi/types';
import { Currency, XChainId } from '@balancednetwork/sdk-core';
import { Trans, t } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { isMobile } from 'react-device-detect';

type XChainListProps = {
  xChainId: XChainId;
  setChainId: (chain: XChainId) => void;
  currency?: Currency;
  chains?: XChain[];
  width?: number;
  isOpen: boolean;
};

type XChainItemProps = {
  xChain: XChain;
  currency?: Currency;
  isActive: boolean;
  isLast: boolean;
};

export const ScrollHelper = styled(Box)<{ $height?: string }>`
  max-height: ${({ $height }) => ($height ? $height : '280px')}; 
  overflow: auto; 
  padding: 0 20px;
  margin: 15px -20px 0 !important;
`;

const StyledHeaderText = styled(HeaderText)`
  font-size: 12px;
`;

const XChainItemWrap = styled(Flex)`
  color: ${({ theme }) => theme.colors?.text};
  cursor: pointer;
  transition: color 0.3s ease;
  align-items: center;
  padding: 20px 0;
  &:hover {
    color: ${({ theme }) => theme.colors?.primaryBright};
  }
`;

const XChainItem = ({ xChain, isActive, isLast, currency }: XChainItemProps) => {
  const walletBalances = useWalletBalances();
  const prices = useRatesWithOracle();
  const hasSignedIn = useHasSignedIn();

  const currencyAmount = React.useMemo(() => {
    if (!walletBalances || !xChain) return;

    return Object.values(walletBalances[xChain.xChainId] || {}).find(
      currencyAmount => currencyAmount.currency.symbol === currency?.symbol,
    );
  }, [walletBalances, currency, xChain]);

  const price = React.useMemo(() => {
    if (!prices || !currencyAmount) return;

    return prices[currencyAmount.currency.symbol];
  }, [prices, currencyAmount]);

  const value = React.useMemo(() => {
    if (!price || !currencyAmount) return;

    return price.times(new BigNumber(currencyAmount.toFixed()));
  }, [price, currencyAmount]);

  return (
    <XChainItemWrap className={isLast ? '' : 'border-bottom'}>
      <Flex width="100%" alignItems="center">
        <Box pr="10px">
          <ChainLogo chain={xChain} />
        </Box>
        <Typography fontWeight="bold" marginRight={2}>
          {xChain.name}
        </Typography>
        {hasSignedIn ? (
          <Typography ml="auto">{value ? formatValue(value.toFixed()).replace('$0.0000', '-') : '-'}</Typography>
        ) : null}
      </Flex>
    </XChainItemWrap>
  );
};

const XChainList = ({ xChainId, setChainId, chains, currency, width, isOpen }: XChainListProps) => {
  const relevantChains = chains || xChains;
  const hasSignedIn = useHasSignedIn();
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const inputRef = React.useRef<HTMLInputElement>();
  const { sortBy, handleSortSelect, sortData } = useSortXChains(
    hasSignedIn ? { key: 'value', order: 'DESC' } : { key: 'symbol', order: 'ASC' },
  );

  const handleInputChange = React.useCallback(event => {
    const input = event.target.value;
    setSearchQuery(input);
  }, []);

  const sortedChains = relevantChains;

  const filteredSortedChains = React.useMemo(() => {
    if (!searchQuery) return sortedChains;
    return sortedChains.filter(chain => chain.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery, sortedChains]);

  React.useEffect(() => {
    let focusTimeout: number | undefined;
    if (isOpen && !isMobile) {
      focusTimeout = window.setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
    return () => {
      clearTimeout(focusTimeout);
    };
  }, [isOpen]);

  return (
    <Box p={'25px 25px 5px'} width={width}>
      <SearchInput
        type="text"
        id="blockchain-search-input"
        style={{ marginBottom: hasSignedIn ? '15px' : '-10px' }}
        placeholder={t`Search blockchains...`}
        tabIndex={isMobile ? -1 : 1}
        autoComplete="off"
        value={searchQuery}
        onChange={handleInputChange}
        ref={inputRef as React.RefObject<HTMLInputElement>}
      />
      <ScrollHelper $height="285px">
        {hasSignedIn ? (
          <Flex width="100%" justifyContent="space-between">
            <StyledHeaderText
              role="button"
              className={sortBy.key === 'name' ? sortBy.order : ''}
              onClick={() =>
                handleSortSelect({
                  key: 'name',
                })
              }
            >
              <span>
                <Trans>Blockchain</Trans>
              </span>
            </StyledHeaderText>
            <StyledHeaderText
              role="button"
              className={sortBy.key === 'value' ? sortBy.order : ''}
              onClick={() =>
                handleSortSelect({
                  key: 'value',
                })
              }
              style={{ cursor: 'pointer' }}
            >
              <span>
                <Trans>Wallet</Trans>
              </span>
            </StyledHeaderText>
          </Flex>
        ) : null}
        {filteredSortedChains.map((chainItem, index) => (
          <Box key={index} onClick={e => setChainId(chainItem.xChainId)}>
            <XChainItem
              xChain={chainItem}
              currency={currency}
              isActive={xChainId === chainItem.xChainId}
              isLast={relevantChains.length === index + 1}
            />
          </Box>
        ))}
        {filteredSortedChains.length === 0 && searchQuery !== '' ? (
          <Typography textAlign="center" mt="23px" mb="24px">
            No results found.
          </Typography>
        ) : null}
      </ScrollHelper>
    </Box>
  );
};

export default XChainList;
