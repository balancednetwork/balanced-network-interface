import React, { /*KeyboardEvent,*/ RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import BigNumber from 'bignumber.js';
import { isMobile } from 'react-device-detect';
import { Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Typography } from 'app/theme';
import SearchIcon from 'assets/icons/search.svg';
import { FUNDING_TOKENS_LIST, useICX } from 'constants/tokens';
import { useAllTokens, useCommonBases, useIsUserAddedToken, useToken } from 'hooks/Tokens';
import useDebounce from 'hooks/useDebounce';
import { useOnClickOutside } from 'hooks/useOnClickOutside';
import useToggle from 'hooks/useToggle';
import { Currency, Token } from 'types/balanced-sdk-core';
import { isAddress } from 'utils';

import Column from '../Column';
import CurrencyList from './CurrencyList';
import { filterTokens, useSortedTokensByQuery } from './filtering';
import ImportRow from './ImportRow';
import { useTokenComparator } from './sorting';

export enum CurrencySelectionType {
  NORMAL,
  TRADE_MINT_BASE,
  TRADE_MINT_QUOTE,
  VOTE_FUNDING,
}

const removebnUSD = (tokens: { [address: string]: Token }) => {
  return Object.values(tokens)
    .filter(token => token.symbol !== 'bnUSD')
    .reduce((tokenMap, token) => {
      tokenMap[token.address] = token;
      return tokenMap;
    }, {});
};

interface CurrencySearchProps {
  account?: string | null;
  isOpen: boolean;
  onDismiss: () => void;
  selectedCurrency?: Currency | null;
  onCurrencySelect: (currency: Currency) => void;
  otherSelectedCurrency?: Currency | null;
  currencySelectionType: CurrencySelectionType;
  showCurrencyAmount?: boolean;
  disableNonToken?: boolean;
  showManageView: () => void;
  showImportView: () => void;
  setImportToken: (token: Token) => void;
  showRemoveView: () => void;
  setRemoveToken: (token: Token) => void;
  width?: number;
  balanceList?: { [key: string]: BigNumber };
}

export function CurrencySearch({
  account,
  selectedCurrency,
  onCurrencySelect,
  otherSelectedCurrency,
  currencySelectionType,
  showCurrencyAmount,
  disableNonToken,
  onDismiss,
  isOpen,
  showManageView,
  showImportView,
  setImportToken,
  showRemoveView,
  setRemoveToken,
  width,
  balanceList,
}: CurrencySearchProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedQuery = useDebounce(searchQuery, 200);

  const [invertSearchOrder] = useState<boolean>(false);

  const tokens = useAllTokens();
  const bases = useCommonBases();

  const allTokens = useMemo(() => {
    switch (currencySelectionType) {
      case CurrencySelectionType.NORMAL:
        return tokens;
      case CurrencySelectionType.TRADE_MINT_BASE:
        return removebnUSD(tokens);
      case CurrencySelectionType.TRADE_MINT_QUOTE:
        return bases;
      case CurrencySelectionType.VOTE_FUNDING:
        return FUNDING_TOKENS_LIST;
    }
  }, [tokens, bases, currencySelectionType]);

  // if they input an address, use it

  const searchToken = useToken(debouncedQuery);

  const searchTokenIsAdded = useIsUserAddedToken(searchToken);

  const tokenComparator = useTokenComparator(account, invertSearchOrder);

  const filteredTokens: Token[] = useMemo(() => {
    return filterTokens(Object.values(allTokens), debouncedQuery);
  }, [allTokens, debouncedQuery]);

  const sortedTokens: Token[] = useMemo(() => {
    return [...filteredTokens].sort(tokenComparator);
  }, [filteredTokens, tokenComparator]);

  const filteredSortedTokens = useSortedTokensByQuery(sortedTokens, debouncedQuery);

  const icx = useICX();

  const filteredSortedTokensWithICX: Currency[] = useMemo(() => {
    const s = debouncedQuery.toLowerCase().trim();
    if ('icon'.indexOf(s) >= 0 || 'icx'.indexOf(s) >= 0) {
      return icx ? [icx, ...filteredSortedTokens] : filteredSortedTokens;
    }
    return filteredSortedTokens;
  }, [debouncedQuery, icx, filteredSortedTokens]);

  const handleCurrencySelect = useCallback(
    (currency: Currency) => {
      onCurrencySelect(currency);
      onDismiss();
    },
    [onDismiss, onCurrencySelect],
  );

  // clear the input on open
  useEffect(() => {
    if (isOpen) setSearchQuery('');
  }, [isOpen]);

  // manage focus on modal show
  const inputRef = useRef<HTMLInputElement>();
  const handleInput = useCallback(event => {
    const input = event.target.value;
    const checksummedInput = isAddress(input);
    setSearchQuery(checksummedInput || input);
  }, []);

  //handle focus on modal open
  useEffect(() => {
    let focusTimeout;
    if (isOpen && !isMobile) {
      focusTimeout = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
    return () => {
      clearTimeout(focusTimeout);
    };
  }, [isOpen]);

  // menu ui
  const [open, toggle] = useToggle(false);
  const node = useRef<HTMLDivElement>();
  useOnClickOutside(node, open ? toggle : undefined);

  const currencies =
    currencySelectionType === CurrencySelectionType.NORMAL ||
    currencySelectionType === CurrencySelectionType.TRADE_MINT_BASE
      ? filteredSortedTokensWithICX
      : filteredSortedTokens;

  return (
    <Wrapper width={width}>
      <Flex>
        <SearchInput
          type="text"
          id="token-search-input"
          placeholder={`Search name or contract`}
          autoComplete="off"
          value={searchQuery}
          ref={inputRef as RefObject<HTMLInputElement>}
          onChange={handleInput}
        />
      </Flex>

      {searchToken && !searchTokenIsAdded ? (
        <Column style={{ padding: '20px 0', height: '100%' }}>
          <ImportRow token={searchToken} showImportView={showImportView} setImportToken={setImportToken} />
        </Column>
      ) : filteredSortedTokensWithICX?.length > 0 ? (
        <CurrencyList
          account={account}
          currencies={currencies}
          onCurrencySelect={handleCurrencySelect}
          showImportView={showImportView}
          setImportToken={setImportToken}
          showRemoveView={showRemoveView}
          setRemoveToken={setRemoveToken}
          showCurrencyAmount={showCurrencyAmount}
          isOpen={isOpen}
          onDismiss={onDismiss}
        />
      ) : (
        <Column style={{ padding: '20px', height: '100%' }}>
          <Typography color="text3" textAlign="center" mb="20px">
            No results found.
          </Typography>
        </Column>
      )}
    </Wrapper>
  );
}

export const SearchInput = styled.input`
  background-image: url(${SearchIcon});
  background-repeat: no-repeat;
  background-size: 18px;
  background-position: 15px 10px;

  position: relative;
  display: flex;
  padding: 3px 20px 3px 45px;
  height: 40px;
  align-items: center;
  width: 100%;
  white-space: nowrap;
  background-color: ${({ theme }) => theme.colors.bg5};
  border: none;
  outline: none;
  border-radius: 10px;
  color: ${({ theme }) => theme.colors.text};
  border-style: solid;
  border: 2px solid ${({ theme }) => theme.colors.bg5};
  -webkit-appearance: none;
  transition: border 0.3s ease;
  font-size: 16px;

  ::placeholder {
    color: rgba(255, 255, 255, 0.75);
    opacity: 1;
  }

  :focus {
    border: 2px solid ${({ theme }) => theme.colors.primary};
    outline: none;
  }

  :hover {
    border: 2px solid ${({ theme }) => theme.colors.primary};
    outline: none;
  }
`;

const Wrapper = styled(Flex)`
  flex-direction: column;
  padding: 25px;
`;
