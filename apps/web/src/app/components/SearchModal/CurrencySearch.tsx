import React, { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Currency, CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import { Trans, t } from '@lingui/macro';
import { isMobile } from 'react-device-detect';
import { Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Typography } from '@/app/theme';
import { FUNDING_TOKENS_LIST, STABLE_TOKENS, UNTRADEABLE_TOKENS } from '@/constants/tokens';
import { useAllTokens, useCommonBases, useIsUserAddedToken, useToken } from '@/hooks/Tokens';
import useDebounce from '@/hooks/useDebounce';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import useToggle from '@/hooks/useToggle';
import { useHasSignedIn, useSignedInWallets } from '@/hooks/useWallets';
import useXTokens from '@/hooks/useXTokens';
import { useRatesWithOracle } from '@/queries/reward';
import { useBridgeDirection } from '@/store/bridge/hooks';
import { useCrossChainWalletBalances } from '@/store/wallet/hooks';
import { isAddress } from '@/utils';
import { XChainId, xChainMap, xTokenMap } from '@balancednetwork/xwagmi';
import BigNumber from 'bignumber.js';
import { ChartControlButton as AssetsTabButton } from '../ChartControl';
import Column from '../Column';
import CommunityListToggle from '../CommunityListToggle';
import CurrencyList from './CurrencyList';
import ImportRow from './ImportRow';
import SearchInput from './SearchInput';
import XChainFilter from './XChainFilter';
import { filterTokens, useSortedTokensByQuery } from './filtering';
import { shouldHideBecauseOfLowValue } from './utils';

export enum CurrencySelectionType {
  TRADE_IN,
  TRADE_OUT,
  TRADE_MINT_BASE,
  TRADE_MINT_QUOTE,
  VOTE_FUNDING,
  BRIDGE,
}

export enum AssetsTab {
  ALL = 'all',
  YOUR = 'your',
}

const FilterWrap = styled(Flex)`
  flex-direction: row;
  flex-wrap: wrap;
  width: 100%;

  & > input {
    flex: 1;
  }

  & > button {
    flex: none;
  }

  & > div {
    flex-basis: 100%;
  }  
`;

const removeStableTokens = (tokens: { [address: string]: Token }) => {
  return Object.values(tokens)
    .filter(token => !STABLE_TOKENS.includes(token.symbol))
    .reduce((tokenMap, token) => {
      tokenMap[token.address] = token;
      return tokenMap;
    }, {});
};

function filterUntradeableTokens(tokens: { [address: string]: Token }): { [address: string]: Token } {
  return Object.values(tokens)
    .filter(token => !UNTRADEABLE_TOKENS.includes(token.symbol))
    .reduce((tokenMap, token) => {
      tokenMap[token.address] = token;
      return tokenMap;
    }, {});
}

function filterUnsupportedTokens(xChainId: XChainId, bases: { [address: string]: Token }) {
  return xChainId === 'archway-1' || xChainId === '0x100.icon'
    ? Object.values(bases)
        .filter(token => token.symbol !== 'sICX')
        .reduce((acc, token) => {
          acc[token.address] = token;
          return acc;
        }, {})
    : bases;
}

interface CurrencySearchProps {
  isOpen: boolean;
  onDismiss: () => void;
  selectedCurrency?: Currency | null;
  onCurrencySelect: (currency: Currency, setDefaultChain?: boolean) => void;
  currencySelectionType: CurrencySelectionType;
  showImportView: () => void;
  setImportToken: (token: Token) => void;
  showRemoveView: () => void;
  setRemoveToken: (token: Token) => void;
  width?: number;
  showCommunityListControl?: boolean;
  xChainId: XChainId;
}

export function CurrencySearch({
  selectedCurrency,
  onCurrencySelect,
  currencySelectionType,
  onDismiss,
  isOpen,
  showImportView,
  setImportToken,
  showRemoveView,
  setRemoveToken,
  width,
  showCommunityListControl,
  xChainId,
}: CurrencySearchProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterState, setFilterState] = useState<XChainId[]>([]);
  const debouncedQuery = useDebounce(searchQuery, 200);
  const hasSignedIn = useHasSignedIn();
  const rates = useRatesWithOracle();
  const wallets = useSignedInWallets();

  const handleChainClick = useCallback((xChainId?: XChainId) => {
    if (xChainId) {
      setFilterState(prev => (prev.includes(xChainId) ? prev.filter(id => id !== xChainId) : [...prev, xChainId]));
    } else {
      setFilterState([]);
    }
  }, []);

  const xWallet = useCrossChainWalletBalances();
  const tokens = useAllTokens();
  const bases = useCommonBases();

  const [assetsTab, setAssetsTab] = useState(AssetsTab.ALL);

  useEffect(() => {
    if (assetsTab === AssetsTab.YOUR && !hasSignedIn) {
      setAssetsTab(AssetsTab.ALL);
    }
  }, [hasSignedIn, assetsTab]);

  useEffect(() => {
    if (
      hasSignedIn &&
      (currencySelectionType === CurrencySelectionType.TRADE_IN ||
        currencySelectionType === CurrencySelectionType.TRADE_MINT_BASE)
    ) {
      setAssetsTab(AssetsTab.YOUR);
    }
  }, [hasSignedIn, currencySelectionType]);

  const handleTabClick = useCallback((tab: AssetsTab) => {
    setAssetsTab(tab);
    setFilterState([]);
  }, []);

  const bridgeDirection = useBridgeDirection();
  const xTokens = useXTokens(bridgeDirection.from, bridgeDirection.to);

  const allTokens: { [address: string]: Token } = useMemo(() => {
    switch (currencySelectionType) {
      case CurrencySelectionType.TRADE_IN:
        return filterUntradeableTokens(tokens);
      case CurrencySelectionType.TRADE_OUT:
        return filterUntradeableTokens(tokens);
      case CurrencySelectionType.TRADE_MINT_BASE:
        return removeStableTokens(filterUntradeableTokens(tokens));
      case CurrencySelectionType.TRADE_MINT_QUOTE:
        return filterUnsupportedTokens(xChainId, bases);
      case CurrencySelectionType.VOTE_FUNDING:
        return FUNDING_TOKENS_LIST;
      case CurrencySelectionType.BRIDGE: {
        return xTokens || [];
      }
    }
  }, [currencySelectionType, tokens, bases, xTokens, xChainId]);

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

  const filteredTokens: Token[] = useMemo(() => {
    return filterTokens(Object.values(allTokens), debouncedQuery);
  }, [allTokens, debouncedQuery]);

  const xChainFilterItems: XChainId[] = useMemo(() => {
    const filteredSymbols = filteredTokens.map(token => token.symbol);

    if (assetsTab === AssetsTab.ALL) {
      if (!!debouncedQuery) {
        const xChainIds = Object.values(xTokenMap)
          .flat()
          .filter(xToken => filteredSymbols.includes(xToken.symbol))
          .map(xToken => xToken.xChainId);
        return [...new Set(xChainIds)];
      } else {
        return Object.values(xChainMap)
          .filter(xChain => !xChain.testnet)
          .map(xChain => xChain.xChainId);
      }
    } else {
      const xChainIds = Object.keys(xWallet).filter(xChainId => {
        return Object.values(xWallet[xChainId]).some(
          currencyAmount =>
            !shouldHideBecauseOfLowValue(
              true,
              rates?.[(currencyAmount as CurrencyAmount<Currency>).currency.symbol],
              new BigNumber((currencyAmount as CurrencyAmount<Currency>).toFixed()),
            ) && filteredSymbols.includes((currencyAmount as CurrencyAmount<Currency>).currency.symbol),
        );
      });
      return xChainIds;
    }
  }, [filteredTokens, assetsTab, xWallet, rates, debouncedQuery]);

  const sortedXChainFilterItems = useMemo(() => {
    return [...xChainFilterItems].sort((a, b) => {
      return xChainMap[a].name.localeCompare(xChainMap[b].name);
    });
  }, [xChainFilterItems]);

  const filteredSortedTokens = useSortedTokensByQuery(filteredTokens, debouncedQuery, assetsTab === AssetsTab.YOUR);

  const handleCurrencySelect = useCallback(
    (currency: Currency, setDefaultChain = true) => {
      onCurrencySelect(currency, setDefaultChain);
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

  // menu ui
  const [open, toggle] = useToggle(false);
  const node = useRef<HTMLDivElement>();
  useOnClickOutside(node, open ? toggle : undefined);

  const selectedChainId = useMemo(() => {
    return currencySelectionType === CurrencySelectionType.TRADE_IN ||
      currencySelectionType === CurrencySelectionType.TRADE_OUT ||
      currencySelectionType === CurrencySelectionType.TRADE_MINT_BASE
      ? undefined
      : xChainId;
  }, [currencySelectionType, xChainId]);

  const shouldShowCurrencyList = useMemo(() => {
    if (assetsTab === AssetsTab.ALL) {
      return true;
    }
    return filteredSortedTokens.some(
      token =>
        xWallet &&
        Object.values(xWallet).filter(wallet =>
          Object.values(wallet).find(
            currencyAmount => currencyAmount.currency.symbol === token.symbol && currencyAmount.greaterThan(0),
          ),
        ).length > 0,
    );
  }, [assetsTab, filteredSortedTokens, xWallet]);

  const shouldShowXChainFilter = useMemo(() => {
    if (
      currencySelectionType === CurrencySelectionType.TRADE_IN ||
      currencySelectionType === CurrencySelectionType.TRADE_OUT
    ) {
      return assetsTab === AssetsTab.ALL || wallets.length > 1;
    }
    return false;
  }, [wallets, currencySelectionType, assetsTab]);

  return (
    <Wrapper width={width}>
      <FilterWrap px="25px">
        <SearchInput
          type="text"
          id="token-search-input"
          placeholder={t`Search assets...`}
          autoComplete="off"
          value={searchQuery}
          ref={inputRef as RefObject<HTMLInputElement>}
          tabIndex={isMobile ? -1 : 1}
          onChange={handleInput}
        />
        {shouldShowXChainFilter && (
          <XChainFilter
            filterItems={sortedXChainFilterItems}
            filterState={filterState}
            onChainClick={handleChainClick}
          />
        )}
      </FilterWrap>
      {hasSignedIn &&
      (currencySelectionType === CurrencySelectionType.TRADE_IN ||
        currencySelectionType === CurrencySelectionType.TRADE_OUT ||
        currencySelectionType === CurrencySelectionType.TRADE_MINT_BASE) ? (
        <Flex justifyContent="center" mt={3}>
          <AssetsTabButton $active={assetsTab === AssetsTab.YOUR} mr={2} onClick={() => handleTabClick(AssetsTab.YOUR)}>
            <Trans>Your assets</Trans>
          </AssetsTabButton>
          <AssetsTabButton $active={assetsTab === AssetsTab.ALL} onClick={() => handleTabClick(AssetsTab.ALL)}>
            <Trans>All assets</Trans>
          </AssetsTabButton>
        </Flex>
      ) : null}
      {searchToken && !searchTokenIsAdded ? (
        <Column style={{ padding: '20px 0', height: '100%' }}>
          <ImportRow token={searchToken} showImportView={showImportView} setImportToken={setImportToken} />
        </Column>
      ) : filteredSortedTokens?.length > 0 && shouldShowCurrencyList ? (
        <CurrencyList
          currencies={filteredSortedTokens}
          filterState={filterState}
          onCurrencySelect={handleCurrencySelect}
          showRemoveView={showRemoveView}
          setRemoveToken={setRemoveToken}
          isOpen={isOpen}
          onDismiss={onDismiss}
          selectedChainId={selectedChainId}
          basedOnWallet={assetsTab === AssetsTab.YOUR}
          width={width}
          currencySelectionType={currencySelectionType}
        />
      ) : (
        <Column style={{ padding: '20px 20px 0 20px' }} mb={showCommunityListControl ? -4 : 0}>
          <Typography color="text3" textAlign="center" mb="20px">
            {debouncedQuery.length ? <Trans>No results found.</Trans> : <Trans>No assets found.</Trans>}
          </Typography>
        </Column>
      )}
      {showCommunityListControl && debouncedQuery.length ? (
        <Flex paddingTop="15px" width="100%" justifyContent="center">
          <CommunityListToggle />
        </Flex>
      ) : null}
    </Wrapper>
  );
}

const Wrapper = styled(Flex)`
  flex-direction: column;
  padding: 25px 0;
`;
