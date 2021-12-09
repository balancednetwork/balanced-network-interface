import React, { /*KeyboardEvent,*/ RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import BigNumber from 'bignumber.js';
import { Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Typography } from 'app/theme';
import { ICX } from 'constants/tokens';
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

interface CurrencySearchProps {
  isOpen: boolean;
  onDismiss: () => void;
  selectedCurrency?: Currency | null;
  onCurrencySelect: (currency: Currency) => void;
  otherSelectedCurrency?: Currency | null;
  showCommonBases?: boolean;
  showCurrencyAmount?: boolean;
  disableNonToken?: boolean;
  showManageView: () => void;
  showImportView: () => void;
  setImportToken: (token: Token) => void;
  width?: number;
  balanceList?: { [key: string]: BigNumber };
}

export function CurrencySearch({
  selectedCurrency,
  onCurrencySelect,
  otherSelectedCurrency,
  showCommonBases,
  showCurrencyAmount,
  disableNonToken,
  onDismiss,
  isOpen,
  showManageView,
  showImportView,
  setImportToken,
  width,
  balanceList,
}: CurrencySearchProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedQuery = useDebounce(searchQuery, 200);

  const [invertSearchOrder] = useState<boolean>(false);

  const tokens = useAllTokens();
  const bases = useCommonBases();
  const allTokens = showCommonBases ? bases : tokens;
  // if they input an address, use it

  const searchToken = useToken(debouncedQuery);

  const searchTokenIsAdded = useIsUserAddedToken(searchToken);

  const tokenComparator = useTokenComparator(invertSearchOrder);

  const filteredTokens: Token[] = useMemo(() => {
    return filterTokens(Object.values(allTokens), debouncedQuery);
  }, [allTokens, debouncedQuery]);

  const sortedTokens: Token[] = useMemo(() => {
    return filteredTokens.sort(tokenComparator);
  }, [filteredTokens, tokenComparator]);

  const filteredSortedTokens = useSortedTokensByQuery(sortedTokens, debouncedQuery);

  const icx = ICX;

  const filteredSortedTokensWithICX: Currency[] = useMemo(() => {
    const s = debouncedQuery.toLowerCase().trim();
    if (s === '' || s === 'i' || s === 'ic' || s === 'icx') {
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

  // menu ui
  const [open, toggle] = useToggle(false);
  const node = useRef<HTMLDivElement>();
  useOnClickOutside(node, open ? toggle : undefined);

  return (
    <Wrapper>
      <Typography variant="h3" mb={4}>
        Select a Token
      </Typography>

      <Flex>
        <SearchInput
          type="text"
          id="token-search-input"
          placeholder={`Search name or paste address`}
          autoComplete="off"
          value={searchQuery}
          ref={inputRef as RefObject<HTMLInputElement>}
          onChange={handleInput}
          // onKeyDown={handleEnter}
        />
      </Flex>

      {searchToken && !searchTokenIsAdded ? (
        <Column style={{ padding: '20px 0', height: '100%' }}>
          <ImportRow token={searchToken} showImportView={showImportView} setImportToken={setImportToken} />
        </Column>
      ) : filteredSortedTokensWithICX?.length > 0 ? (
        <CurrencyList
          currencies={showCommonBases ? filteredSortedTokens : filteredSortedTokensWithICX}
          onCurrencySelect={handleCurrencySelect}
          showImportView={showImportView}
          setImportToken={setImportToken}
          showCurrencyAmount={showCurrencyAmount}
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
  position: relative;
  display: flex;
  padding: 3px 20px;
  height: 40px;
  align-items: center;
  width: 100%;
  white-space: nowrap;
  background: ${({ theme }) => theme.colors.bg5};
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
  width: 100%;
  padding: 25px;
`;
