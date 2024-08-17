import React, { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Currency, Token } from '@balancednetwork/sdk-core';
import { t, Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { isMobile } from 'react-device-detect';
import { Flex } from 'rebass/styled-components';
import styled from 'styled-components';
import { ChartControlButton as AssetsTabButton } from '@/app/pages/trade/supply/_components/utils';

import { Typography } from '@/app/theme';
import { FUNDING_TOKENS_LIST, useICX } from '@/constants/tokens';
import { useAllTokens, useCommonBases, useIsUserAddedToken, useToken } from '@/hooks/Tokens';
import useDebounce from '@/hooks/useDebounce';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import useToggle from '@/hooks/useToggle';
import { isAddress } from '@/utils';

import Column from '../Column';
import CurrencyList from './CurrencyList';
import { filterTokens, useSortedTokensByQuery } from './filtering';
import ImportRow from './ImportRow';
import SearchInput from './SearchInput';
import { useTokenComparator } from './sorting';
import { XChainId } from '@/app/pages/trade/bridge/types';
import { useBridgeDirection } from '@/store/bridge/hooks';
import useXTokens from '@/app/pages/trade/bridge/_hooks/useXTokens';
import { xTokenMap } from '@/app/pages/trade/bridge/_config/xTokens';
import { useSignedInWallets } from '@/app/pages/trade/bridge/_hooks/useWallets';

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
  OTHER,
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
  onCurrencySelect: (currency: Currency, setDefaultChain?: boolean) => void;
  onChainSelect?: (chainId: XChainId) => void;
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
  xChainId: XChainId;
  showCrossChainBreakdown: boolean;
  selectorType?: SelectorType;
}

const useFilteredXTokens = () => {
  const tokens = useAllTokens();

  return useMemo(() => {
    const allTokens = Object.values(tokens);
    const allXTokens = Object.values(xTokenMap).flat();
    return allXTokens.filter(x => !allTokens.some(t => t.symbol === x.symbol));
  }, [tokens]);
};

export function CurrencySearch({
  account,
  selectedCurrency,
  onCurrencySelect,
  onChainSelect,
  showCrossChainBreakdown,
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
  xChainId,
  selectorType = SelectorType.OTHER,
}: CurrencySearchProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedQuery = useDebounce(searchQuery, 200);
  const signedInWallets = useSignedInWallets();

  const [invertSearchOrder] = useState<boolean>(false);

  const tokens = useAllTokens();
  const filteredXTokens = useFilteredXTokens();
  const bases = useCommonBases();

  const [assetsTab, setAssetsTab] = useState(AssetsTab.ALL);

  useEffect(() => {
    if (assetsTab === AssetsTab.YOUR && !signedInWallets.length) {
      setAssetsTab(AssetsTab.ALL);
    }
  }, [signedInWallets, assetsTab]);

  useEffect(() => {
    if (signedInWallets.length && selectorType === SelectorType.SWAP_IN) {
      setAssetsTab(AssetsTab.YOUR);
    }
  }, [signedInWallets, selectorType]);

  const bridgeDirection = useBridgeDirection();
  const xTokens = useXTokens(bridgeDirection.from, bridgeDirection.to);

  const allTokens: { [address: string]: Token } = useMemo(() => {
    switch (currencySelectionType) {
      case CurrencySelectionType.NORMAL:
        return { ...tokens, ...filteredXTokens };
      case CurrencySelectionType.TRADE_MINT_BASE:
        return removebnUSD(tokens);
      case CurrencySelectionType.TRADE_MINT_QUOTE:
        return bases;
      case CurrencySelectionType.VOTE_FUNDING:
        return FUNDING_TOKENS_LIST;
      case CurrencySelectionType.BRIDGE: {
        return xTokens || [];
      }
    }
  }, [currencySelectionType, tokens, bases, xTokens, filteredXTokens]);

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

  const filteredSortedTokens = useSortedTokensByQuery(sortedTokens, debouncedQuery, assetsTab === AssetsTab.YOUR);

  const icx = useICX();

  const filteredSortedTokensWithICX: Currency[] = useMemo(() => {
    const s = debouncedQuery.toLowerCase().trim();
    if ('0x1.icon'.indexOf(s) >= 0 || 'icx'.indexOf(s) >= 0) {
      return icx ? [icx, ...filteredSortedTokens] : filteredSortedTokens;
    }
    return filteredSortedTokens;
  }, [debouncedQuery, icx, filteredSortedTokens]);

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

  const filterCurrencies = useMemo(() => {
    const currencies =
      currencySelectionType === CurrencySelectionType.NORMAL ||
      currencySelectionType === CurrencySelectionType.TRADE_MINT_BASE
        ? filteredSortedTokensWithICX
        : filteredSortedTokens;

    return currencies;
  }, [currencySelectionType, filteredSortedTokens, filteredSortedTokensWithICX]);

  const selectedChainId = useMemo(() => {
    return currencySelectionType === CurrencySelectionType.NORMAL ? undefined : xChainId;
  }, [currencySelectionType, xChainId]);

  return (
    <Wrapper width={width}>
      <Flex px="25px">
        <SearchInput
          type="text"
          id="token-search-input"
          placeholder={t`Search name or contract`}
          autoComplete="off"
          value={searchQuery}
          ref={inputRef as RefObject<HTMLInputElement>}
          tabIndex={isMobile ? -1 : 1}
          onChange={handleInput}
        />
      </Flex>
      {signedInWallets.length ? (
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
      ) : filteredSortedTokensWithICX?.length > 0 ? (
        <CurrencyList
          account={account}
          currencies={filterCurrencies}
          onCurrencySelect={handleCurrencySelect}
          onChainSelect={onChainSelect}
          showImportView={showImportView}
          setImportToken={setImportToken}
          showRemoveView={showRemoveView}
          setRemoveToken={setRemoveToken}
          showCurrencyAmount={showCurrencyAmount}
          isOpen={isOpen}
          onDismiss={onDismiss}
          selectedChainId={selectedChainId}
          showCrossChainBreakdown={showCrossChainBreakdown}
          basedOnWallet={assetsTab === AssetsTab.YOUR}
        />
      ) : (
        <Column style={{ padding: '20px', height: '100%' }}>
          <Typography color="text3" textAlign="center" mb="20px">
            <Trans>No results found.</Trans>
          </Typography>
        </Column>
      )}
      {/* //TODO: move community list control to token list below main swap section */}
      {/* {showCommunityListControl && (
        <Flex justifyContent="center" paddingTop="20px">
          <CommunityListToggle></CommunityListToggle>
        </Flex>
      )} */}
    </Wrapper>
  );
}

const Wrapper = styled(Flex)`
  flex-direction: column;
  padding: 25px 0;
`;
