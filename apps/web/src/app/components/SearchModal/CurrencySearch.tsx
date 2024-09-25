import React, { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Currency, Token, XToken } from '@balancednetwork/sdk-core';
import { Trans, t } from '@lingui/macro';
import { isMobile } from 'react-device-detect';
import { Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Typography } from '@/app/theme';
import { useCommonBases, useIsUserAddedToken, useToken } from '@/hooks/Tokens';
import useDebounce from '@/hooks/useDebounce';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import useToggle from '@/hooks/useToggle';
import { useHasSignedIn } from '@/hooks/useWallets';

import { useWalletBalances } from '@/store/wallet/hooks';
import { isAddress } from '@/utils';
import { allXTokens } from '@/xwagmi/constants/xTokens';
import { XChainId } from '@balancednetwork/sdk-core';
import { ChartControlButton as AssetsTabButton } from '../ChartControl';
import Column from '../Column';
import CommunityListToggle from '../CommunityListToggle';
import CurrencyList from './CurrencyList';
import ImportRow from './ImportRow';
import SearchInput from './SearchInput';
import { filterTokens, useSortedTokensByQuery } from './filtering';
import { useTokenComparator } from './sorting';

export enum CurrencySelectionType {
  NORMAL,
  TRADE_MINT_BASE,
  TRADE_MINT_QUOTE,
  VOTE_FUNDING,
  BRIDGE,
}

export enum AssetsTab {
  ALL = 'all',
  YOUR = 'your',
}

export enum SelectorType {
  SWAP_IN,
  SWAP_OUT,
  SUPPLY_QUOTE,
  SUPPLY_BASE,
  BRIDGE,
  OTHER,
}

interface CurrencySearchProps {
  account?: string | null;
  isOpen: boolean;
  onDismiss: () => void;
  selectedCurrency?: XToken | null;
  onCurrencySelect: (currency: XToken) => void;
  onChainSelect?: (chainId: XChainId) => void;
  currencySelectionType: CurrencySelectionType;
  showCurrencyAmount?: boolean;
  showImportView: () => void;
  setImportToken: (token: Token) => void;
  showRemoveView: () => void;
  setRemoveToken: (token: Token) => void;
  width?: number;
  showCommunityListControl?: boolean;
  xChainId: XChainId;
  showCrossChainBreakdown: boolean;
  selectorType?: SelectorType;
}

export function CurrencySearch({
  account,
  selectedCurrency,
  onCurrencySelect,
  onChainSelect,
  showCrossChainBreakdown,
  currencySelectionType,
  showCurrencyAmount,
  onDismiss,
  isOpen,
  showImportView,
  setImportToken,
  showRemoveView,
  setRemoveToken,
  width,
  showCommunityListControl,
  xChainId,
  selectorType = SelectorType.OTHER,
}: CurrencySearchProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedQuery = useDebounce(searchQuery, 200);
  const hasSignedIn = useHasSignedIn();

  const [invertSearchOrder] = useState<boolean>(false);

  const walletBalances = useWalletBalances();

  const [assetsTab, setAssetsTab] = useState(AssetsTab.ALL);

  useEffect(() => {
    if (assetsTab === AssetsTab.YOUR && !hasSignedIn) {
      setAssetsTab(AssetsTab.ALL);
    }
  }, [hasSignedIn, assetsTab]);

  useEffect(() => {
    if (hasSignedIn && selectorType === SelectorType.SWAP_IN) {
      setAssetsTab(AssetsTab.YOUR);
    }
  }, [hasSignedIn, selectorType]);

  const allTokens = allXTokens;

  // if they input an address, use it

  const searchToken = useToken(debouncedQuery);

  const searchTokenIsAdded = useIsUserAddedToken(searchToken);

  const tokenComparator = useTokenComparator(account, invertSearchOrder);

  const filteredTokens = useMemo(() => {
    return filterTokens(allTokens, debouncedQuery);
  }, [allTokens, debouncedQuery]);

  const sortedTokens = useMemo(() => {
    return [...filteredTokens].sort(tokenComparator);
  }, [filteredTokens, tokenComparator]);

  const filteredSortedTokens = useSortedTokensByQuery(sortedTokens, debouncedQuery, assetsTab === AssetsTab.YOUR);

  const handleCurrencySelect = useCallback(
    (currency: XToken) => {
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
    return currencySelectionType === CurrencySelectionType.NORMAL ? undefined : xChainId;
  }, [currencySelectionType, xChainId]);

  const shouldShowCurrencyList = useMemo(() => {
    if (assetsTab === AssetsTab.ALL) {
      return true;
    }
    return filteredSortedTokens.some(
      token =>
        walletBalances &&
        Object.values(walletBalances).filter(
          balance => balance.currency.symbol === token.symbol && balance.greaterThan(0),
        ).length > 0,
    );
  }, [assetsTab, walletBalances, filteredSortedTokens]);

  return (
    <Wrapper width={width}>
      <Flex px="25px">
        <SearchInput
          type="text"
          id="token-search-input"
          placeholder={t`Search name or contract...`}
          autoComplete="off"
          value={searchQuery}
          ref={inputRef as RefObject<HTMLInputElement>}
          tabIndex={isMobile ? -1 : 1}
          onChange={handleInput}
        />
      </Flex>
      {hasSignedIn && (selectorType === SelectorType.SWAP_IN || selectorType === SelectorType.SWAP_OUT) ? (
        <Flex justifyContent="center" mt={3}>
          <AssetsTabButton $active={assetsTab === AssetsTab.YOUR} mr={2} onClick={() => setAssetsTab(AssetsTab.YOUR)}>
            <Trans>Your assets</Trans>
          </AssetsTabButton>
          <AssetsTabButton $active={assetsTab === AssetsTab.ALL} onClick={() => setAssetsTab(AssetsTab.ALL)}>
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
          onCurrencySelect={handleCurrencySelect}
          onChainSelect={onChainSelect}
          showRemoveView={showRemoveView}
          setRemoveToken={setRemoveToken}
          isOpen={isOpen}
          onDismiss={onDismiss}
          selectedChainId={selectedChainId}
          showCrossChainBreakdown={showCrossChainBreakdown}
          basedOnWallet={assetsTab === AssetsTab.YOUR}
          selectorType={selectorType}
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
