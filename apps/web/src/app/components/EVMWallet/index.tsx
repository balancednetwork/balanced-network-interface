import React, { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Token } from '@balancednetwork/sdk-core';
import { t, Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { isMobile } from 'react-device-detect';
import { useMedia } from 'react-use';
import { Flex } from 'rebass/styled-components';

import CurrencyLogo from 'app/components/CurrencyLogo';
import { Typography } from 'app/theme';
import '@reach/tabs/styles.css';
import { HIGH_PRICE_ASSET_DP } from 'constants/tokens';
import useArrowControl from 'hooks/useArrowControl';
import useDebounce from 'hooks/useDebounce';
import useKeyPress from 'hooks/useKeyPress';
import { useRatesWithOracle } from 'queries/reward';
import { useWalletModalToggle } from 'store/application/hooks';
import { useSignedInWallets, useWalletBalances } from 'store/wallet/hooks';
import { isDPZeroCA, toFraction } from 'utils';

import Divider from '../Divider';
import { UnderlineText } from '../DropdownText';
import { CopyableAddress } from '../Header';
import {
  AssetSymbol,
  BalanceAndValueWrap,
  DashGrid,
  DataText,
  HeaderText,
  List,
  StandardCursorListItem,
  WalletAssets,
  WalletTotal,
  Wrapper,
} from '../ICONWallet';
import { filterTokens, useSortedTokensByQuery } from '../SearchModal/filtering';
import SearchInput from '../SearchModal/SearchInput';
import { useTokenComparator } from '../SearchModal/sorting';
import { useXTokens, useXWallet } from 'app/_xcall/hooks';
import { XChainId } from 'app/_xcall/types';

const walletBreakpoint = '499px';

const EVMWallet = ({ setAnchor, anchor }) => {
  const isSmallScreen = useMedia(`(max-width: ${walletBreakpoint})`);
  const xChainId: XChainId = '0xa86a.avax';
  const balances = useWalletBalances(xChainId);
  const xWallet = useXWallet(xChainId);
  const account = xWallet.account;

  const [searchQuery, setSearchQuery] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>();

  const debouncedQuery = useDebounce(searchQuery, 200);
  const enter = useKeyPress('Enter');
  const handleEscape = useKeyPress('Escape');
  const toggleWalletModal = useWalletModalToggle();
  const signedInWallets = useSignedInWallets();

  const tokenComparator = useTokenComparator(account, false);

  const xTokens = useXTokens(xChainId);

  const addressesWithAmount = useMemo(
    () =>
      xTokens
        ?.map(t => t.address)
        .filter(address => !isDPZeroCA(balances?.[address], HIGH_PRICE_ASSET_DP[address] || 2)),
    [balances, xTokens],
  );

  const filteredTokens: Token[] = useMemo(() => {
    return filterTokens(xTokens || [], debouncedQuery).filter(
      token => (addressesWithAmount || [])?.indexOf(token.address) >= 0,
    );
  }, [debouncedQuery, addressesWithAmount, xTokens]);

  const sortedTokens: Token[] = useMemo(() => {
    return filteredTokens.sort(tokenComparator);
  }, [filteredTokens, tokenComparator]);

  const filteredSortedTokens = useSortedTokensByQuery(sortedTokens, debouncedQuery);

  // rates: using symbol as key?
  const rates = useRatesWithOracle();
  const rateFracs = React.useMemo(() => {
    if (rates) {
      return Object.keys(rates).reduce((acc, key) => {
        acc[key] = toFraction(rates[key]);
        return acc;
      }, {});
    }
  }, [rates]);

  const valueSortedTokens = useMemo(() => {
    return rateFracs && Object.keys(rateFracs).length && balances && Object.keys(balances).length
      ? filteredSortedTokens.sort((a, b) => {
          if (a.isNative || b.isNative) return 0;
          if (balances[a.address] && balances[b.address] && rateFracs[a.symbol!] && rateFracs[b.symbol!]) {
            const valueA = balances[a.address].multiply(rateFracs[a.symbol!]);
            const valueB = balances[b.address].multiply(rateFracs[b.symbol!]);
            if (valueA.greaterThan(valueB)) return -1;
            if (valueB.greaterThan(valueA)) return 1;
            return 0;
          }
          return 0;
        })
      : filteredSortedTokens;
  }, [filteredSortedTokens, balances, rateFracs]);

  const { activeIndex, setActiveIndex } = useArrowControl(anchor !== null, filteredSortedTokens.length);

  const totalBalance = useMemo(
    () =>
      filteredSortedTokens.reduce((total, token) => {
        const { address, symbol } = token.wrapped;
        const tokenValue =
          rateFracs && rateFracs[symbol!] && balances
            ? new BigNumber(balances[address].multiply(rateFracs[symbol!]).toFixed(2))
            : new BigNumber(0);
        return total.plus(tokenValue);
      }, new BigNumber(0)),
    [filteredSortedTokens, balances, rateFracs],
  );

  useEffect(() => {
    if (handleEscape) {
      setAnchor(null);
    }
  }, [handleEscape, setAnchor]);

  useEffect(() => {
    if (anchor) {
      setActiveIndex(undefined);
    }
  }, [anchor, setActiveIndex]);

  useEffect(() => {
    let focusTimeout;
    if (anchor && !isMobile) {
      focusTimeout = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
    return () => {
      clearTimeout(focusTimeout);
    };
  }, [anchor]);

  const TokenInfo = ({ currency }) => {
    const { symbol, address } = currency;
    return (
      <>
        <AssetSymbol>
          <CurrencyLogo currency={currency} />
          <Typography fontSize={16} fontWeight="bold">
            {symbol}
          </Typography>
        </AssetSymbol>
        <BalanceAndValueWrap>
          <DataText as="div">
            {!account ? '-' : balances?.[address]?.toFixed(HIGH_PRICE_ASSET_DP[address] || 2, { groupSeparator: ',' })}
          </DataText>

          <DataText as="div">
            {!account || !rates || !symbol || !rates[symbol] || !rateFracs
              ? '-'
              : `$${balances?.[address]?.multiply(rateFracs[symbol]).toFixed(2, { groupSeparator: ',' })}`}
          </DataText>
        </BalanceAndValueWrap>
      </>
    );
  };

  if (!account) {
    return (
      <WalletAssets>
        <Flex pb="25px">
          <Typography mr="5px">
            <Trans>Sign in with</Trans>
          </Typography>
          <Typography color="primaryBright">
            <UnderlineText onClick={toggleWalletModal}>
              <Trans>Archway wallet</Trans>
            </UnderlineText>
          </Typography>
        </Flex>
      </WalletAssets>
    );
  }

  return (
    <>
      <WalletAssets>
        {signedInWallets.length > 1 && (
          <Flex padding="0 0 20px">
            <CopyableAddress account={account} closeAfterDelay={1000} copyIcon />
          </Flex>
        )}
        <SearchInput
          type="text"
          id="token-search-input"
          placeholder={t`Search assets`}
          autoComplete="off"
          value={searchQuery}
          ref={inputRef as RefObject<HTMLInputElement>}
          onChange={e => {
            setSearchQuery(e.target.value);
            activeIndex === undefined && setActiveIndex(0);
          }}
        />

        {filteredSortedTokens.length ? (
          <>
            <DashGrid marginTop={'15px'}>
              <HeaderText>
                <Trans>Asset</Trans>
              </HeaderText>
              <BalanceAndValueWrap>
                <HeaderText>
                  <Trans>Balance</Trans>
                </HeaderText>
                {isSmallScreen ? null : (
                  <HeaderText>
                    <Trans>Value</Trans>
                  </HeaderText>
                )}
              </BalanceAndValueWrap>
            </DashGrid>

            <List>
              {valueSortedTokens.map((currency, index, arr) => {
                const symbol = currency.symbol!;
                return (
                  <StandardCursorListItem
                    className={index === activeIndex ? 'active' : ''}
                    key={symbol}
                    border={index !== arr.length - 1}
                    // onMouseEnter={() => setActiveIndex(index)}
                    // onClick={() => handleAssetClick(symbol)}
                  >
                    <TokenInfo currency={currency} />
                  </StandardCursorListItem>
                );
              })}
            </List>
            <Divider />
            <WalletTotal>
              <HeaderText>
                <Trans>Total</Trans>
              </HeaderText>
              <Typography color="text" fontWeight={700}>
                ${totalBalance.toFormat(2)}
              </Typography>
            </WalletTotal>
          </>
        ) : (
          <Wrapper>
            <Typography textAlign="center" paddingY={'20px'}>
              <Trans>No assets available.</Trans>
            </Typography>
          </Wrapper>
        )}
      </WalletAssets>
    </>
  );
};

export default EVMWallet;
