import React from 'react';

import { Box, Flex } from 'rebass';
import styled from 'styled-components';

import { ChainLogo } from '@/app/components/ChainLogo';
import SearchInput from '@/app/components/SearchModal/SearchInput';
import { HeaderText } from '@/app/components/SearchModal/styleds';
import { ScrollHelper } from '@/app/components/home/_components/LoanChainSelector/styledComponents';
import { Typography } from '@/app/theme';
import { xChains } from '@/constants/xChains';
import useSortXChains from '@/hooks/useSortXChains';
import { useSignedInWallets } from '@/hooks/useWallets';
import { useRatesWithOracle } from '@/queries/reward';
import { useCrossChainWalletBalances } from '@/store/wallet/hooks';
import { XChain, XChainId } from '@/types/xChain';
import { formatValue } from '@/utils/formatter';
import { Currency } from '@balancednetwork/sdk-core';
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

const StyledHeaderText = styled(HeaderText)`
  font-size: 12px;
`;

const XChainItemWrap = styled(Flex)`
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  transition: color 0.3s ease;
  align-items: center;
  padding: 20px 0;
  &:hover {
    color: ${({ theme }) => theme.colors.primaryBright};
  }
`;

const XChainItem = ({ xChain, isActive, isLast, currency }: XChainItemProps) => {
  const xWallet = useCrossChainWalletBalances();
  const prices = useRatesWithOracle();

  const currencyAmount = React.useMemo(() => {
    if (!xWallet || !xChain) return;

    return Object.values(xWallet[xChain.xChainId] || {}).find(
      currencyAmount => currencyAmount.currency.symbol === currency?.symbol,
    );
  }, [xWallet, currency, xChain]);

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
        <Typography ml="auto">{value ? formatValue(value.toFixed()).replace('$0.0000', '-') : '-'}</Typography>
      </Flex>
    </XChainItemWrap>
  );
};

const XChainList = ({ xChainId, setChainId, chains, currency, width, isOpen }: XChainListProps) => {
  const relevantChains = chains || xChains;
  const signedInWallets = useSignedInWallets();
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const inputRef = React.useRef<HTMLInputElement>();
  const { sortBy, handleSortSelect, sortData } = useSortXChains(
    signedInWallets ? { key: 'value', order: 'DESC' } : { key: 'symbol', order: 'ASC' },
    currency,
  );

  const handleInputChange = React.useCallback(event => {
    const input = event.target.value;
    setSearchQuery(input);
  }, []);

  const sortedChains = React.useMemo(
    () => (currency ? sortData(relevantChains, currency) : []),
    [relevantChains, currency, sortData],
  );

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
        style={{ marginBottom: '15px' }}
        placeholder={t`Search for blockchains...`}
        tabIndex={isMobile ? -1 : 1}
        autoComplete="off"
        value={searchQuery}
        onChange={handleInputChange}
        ref={inputRef as React.RefObject<HTMLInputElement>}
      />
      <ScrollHelper $height="285px">
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
            onClick={
              signedInWallets.length > 0
                ? () =>
                    handleSortSelect({
                      key: 'value',
                    })
                : () => {}
            }
            style={signedInWallets.length > 0 ? { cursor: 'pointer' } : { cursor: 'not-allowed' }}
          >
            <span>
              <Trans>Wallet</Trans>
            </span>
          </StyledHeaderText>
        </Flex>
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
