import React, { /*KeyboardEvent,*/ RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Currency, Token } from '@balancednetwork/sdk-core';
import { t, Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { isMobile } from 'react-device-detect';
import { Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { ARCHWAY_SUPPORTED_TOKENS_LIST } from 'app/_xcall/archway/tokens';
import { Typography } from 'app/theme';
import { FUNDING_TOKENS_LIST, useICX } from 'constants/tokens';
import { useAllTokens, useCommonBases, useIsUserAddedToken, useToken } from 'hooks/Tokens';
import useDebounce from 'hooks/useDebounce';
import { useOnClickOutside } from 'hooks/useOnClickOutside';
import useToggle from 'hooks/useToggle';
import { useBridgeDirection } from 'store/bridge/hooks';
import { isAddress } from 'utils';

import Column from '../Column';
import CommunityListToggle from '../CommunityListToggle';
import CurrencyList from './CurrencyList';
import { filterTokens, useSortedTokensByQuery } from './filtering';
import ImportRow from './ImportRow';
import SearchInput from './SearchInput';
import { useTokenComparator } from './sorting';

export enum CurrencySelectionType {
  NORMAL,
  TRADE_MINT_BASE,
  TRADE_MINT_QUOTE,
  VOTE_FUNDING,
  BRIDGE,
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
  showCommunityListControl?: boolean;
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
  showCommunityListControl,
}: CurrencySearchProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedQuery = useDebounce(searchQuery, 200);

  const [invertSearchOrder] = useState<boolean>(false);

  const tokens = useAllTokens();
  const bases = useCommonBases();
  const bridgeDirection = useBridgeDirection();

  const bridgeDirectionString = `${bridgeDirection.from}-${bridgeDirection.to}`;

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
      case CurrencySelectionType.BRIDGE: {
        //TODO: handle for multiple chain selections in the future
        if (bridgeDirectionString === 'archway-icon') {
          return ARCHWAY_SUPPORTED_TOKENS_LIST.reduce((tokens, token) => {
            tokens[token.address] = token;
            return tokens;
          }, {} as { [address: string]: Token });
        } else if (bridgeDirectionString === 'icon-archway') {
          const archSymbols = ARCHWAY_SUPPORTED_TOKENS_LIST.map(token => token.symbol);
          return Object.keys(tokens).reduce((tokenUnion, token) => {
            if (archSymbols.includes(tokens[token].symbol)) {
              tokenUnion[token] = tokens[token];
            }
            return tokenUnion;
          }, {} as { [address: string]: Token });
        } else {
          return tokens;
        }
      }
    }
  }, [currencySelectionType, tokens, bases, bridgeDirectionString]);

  //select first currency from list if there is none selected for bridging
  useEffect(() => {
    if (!selectedCurrency && currencySelectionType === CurrencySelectionType.BRIDGE) {
      const firstCurrency = Object.values(allTokens)[0];
      onCurrencySelect(firstCurrency);
    }
  }, [selectedCurrency, allTokens, onCurrencySelect, currencySelectionType]);

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

  const filterCurrencies = useMemo(() => {
    const currencies =
      currencySelectionType === CurrencySelectionType.NORMAL ||
      currencySelectionType === CurrencySelectionType.TRADE_MINT_BASE
        ? filteredSortedTokensWithICX
        : filteredSortedTokens;
    return currencies;
  }, [currencySelectionType, filteredSortedTokens, filteredSortedTokensWithICX]);

  return (
    <Wrapper width={width}>
      <Flex>
        <SearchInput
          type="text"
          id="token-search-input"
          placeholder={t`Search name or contract`}
          autoComplete="off"
          value={searchQuery}
          ref={inputRef as RefObject<HTMLInputElement>}
          onChange={handleInput}
        />
      </Flex>

      {showCommunityListControl && (
        <Flex justifyContent="center" paddingTop="10px">
          <CommunityListToggle></CommunityListToggle>
        </Flex>
      )}

      {searchToken && !searchTokenIsAdded ? (
        <Column style={{ padding: '20px 0', height: '100%' }}>
          <ImportRow token={searchToken} showImportView={showImportView} setImportToken={setImportToken} />
        </Column>
      ) : filteredSortedTokensWithICX?.length > 0 ? (
        <CurrencyList
          account={account}
          currencies={filterCurrencies}
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
            <Trans>No results found.</Trans>
          </Typography>
        </Column>
      )}
    </Wrapper>
  );
}

const Wrapper = styled(Flex)`
  flex-direction: column;
  padding: 25px;
`;
