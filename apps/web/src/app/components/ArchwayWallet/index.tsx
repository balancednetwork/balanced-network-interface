import React, { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { BalancedJs } from '@balancednetwork/balanced-js';
import { Currency, Token } from '@balancednetwork/sdk-core';
import { t, Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { useIconReact } from 'packages/icon-react';
import { isMobile } from 'react-device-detect';
import { useMedia } from 'react-use';
import { Flex } from 'rebass/styled-components';

import { useArchwayContext } from 'app/_xcall/archway/ArchwayProvider';
import {
  ARCHWAY_SUPPORTED_TOKENS_LIST,
  ARCHWAY_SUPPORTED_TOKENS_MAP_BY_ADDRESS,
  useARCH,
} from 'app/_xcall/archway/tokens';
import CurrencyLogo from 'app/components/CurrencyLogo';
import Modal from 'app/components/Modal';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import '@reach/tabs/styles.css';
import { HIGH_PRICE_ASSET_DP } from 'constants/tokens';
import useArrowControl from 'hooks/useArrowControl';
import useDebounce from 'hooks/useDebounce';
import useKeyPress from 'hooks/useKeyPress';
import { useRatesWithOracle } from 'queries/reward';
import { useWalletModalToggle } from 'store/application/hooks';
import { useAllTransactions } from 'store/transactions/hooks';
import { useArchwayWalletBalances, useSignedInWallets } from 'store/wallet/hooks';
import { isDPZeroCA, toFraction } from 'utils';

import Divider from '../Divider';
import { UnderlineText } from '../DropdownText';
import { CopyableAddress } from '../Header';
import {
  AssetSymbol,
  BalanceAndValueWrap,
  BoxPanelWithArrow,
  DashGrid,
  DataText,
  HeaderText,
  List,
  ModalContent,
  StandardCursorListItem,
  WalletAssets,
  WalletTotal,
  Wrapper,
} from '../ICONWallet';
import { filterTokens, useSortedTokensByQuery } from '../SearchModal/filtering';
import SearchInput from '../SearchModal/SearchInput';
import { useTokenComparator } from '../SearchModal/sorting';
import ICXWallet from './wallets/ICXWallet';
import SendPanel from './wallets/SendPanel';
import SICXWallet from './wallets/SICXWallet';

const WalletUIs = {
  ICX: ICXWallet,
  sICX: SICXWallet,
};

const walletBreakpoint = '499px';

const ADDRESSES = ARCHWAY_SUPPORTED_TOKENS_LIST.map(currency => currency.address);

const WalletUI = ({ currency }: { currency: Currency }) => {
  const [claimableICX, setClaimableICX] = useState(new BigNumber(0));
  const { account } = useIconReact();
  const transactions = useAllTransactions();

  useEffect(() => {
    (async () => {
      if (account) {
        const result = await bnJs.Staking.getClaimableICX(account);
        setClaimableICX(BalancedJs.utils.toIcx(result));
      }
    })();
  }, [account, transactions]);

  const UI = currency.symbol ? WalletUIs[currency.symbol] ?? SendPanel : SendPanel;
  if (currency.symbol === 'ICX') {
    return <UI currency={currency} claimableICX={claimableICX} />;
  } else {
    return <UI currency={currency} />;
  }
};

const ArchwayWallet = ({ setAnchor, anchor, ...rest }) => {
  const isSmallScreen = useMedia(`(max-width: ${walletBreakpoint})`);
  const balances = useArchwayWalletBalances();
  const arch = useARCH();
  const { address: accountArch } = useArchwayContext();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>();
  const [modalAsset] = useState<string | undefined>();

  const debouncedQuery = useDebounce(searchQuery, 200);
  const enter = useKeyPress('Enter');
  const escape = useKeyPress('Escape');
  const [isOpen, setOpen] = useState(false);
  const toggleWalletModal = useWalletModalToggle();
  const signedInWallets = useSignedInWallets();

  const tokenComparator = useTokenComparator(accountArch, false);

  // const icxAddress = bnJs.ICX.address;

  const addressesWithAmount = useMemo(
    () => ADDRESSES.filter(address => !isDPZeroCA(balances[address], HIGH_PRICE_ASSET_DP[address] || 2)),
    [balances],
  );

  const filteredTokens: Token[] = useMemo(() => {
    return filterTokens(Object.values(ARCHWAY_SUPPORTED_TOKENS_MAP_BY_ADDRESS), debouncedQuery).filter(
      token => addressesWithAmount.indexOf(token.address) >= 0,
    );
  }, [debouncedQuery, addressesWithAmount]);

  const sortedTokens: Token[] = useMemo(() => {
    if (balances[arch.address]?.greaterThan(0)) {
      return [arch, ...filteredTokens].sort(tokenComparator);
    } else {
      return filteredTokens.sort(tokenComparator);
    }
  }, [arch, balances, filteredTokens, tokenComparator]);

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

  // const handleAssetClick = (asset: string) => {
  //   setModalAsset(asset);
  //   showModal();
  // };

  const showModal = useCallback(() => {
    setOpen(true);
  }, [setOpen]);

  useEffect(() => {
    if (escape) {
      setAnchor(null);
    }
  }, [escape, setAnchor]);

  useEffect(() => {
    if (enter && anchor) {
      showModal();
    }
  }, [enter, anchor, showModal]);

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
            {!accountArch
              ? '-'
              : balances[address]?.toFixed(HIGH_PRICE_ASSET_DP[address] || 2, { groupSeparator: ',' })}
          </DataText>

          <DataText as="div">
            {!accountArch || !rates || !symbol || !rates[symbol] || !rateFracs
              ? '-'
              : `$${balances[address]?.multiply(rateFracs[symbol]).toFixed(2, { groupSeparator: ',' })}`}
          </DataText>
        </BalanceAndValueWrap>
      </>
    );
  };

  if (!accountArch) {
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
            <CopyableAddress account={accountArch} closeAfterDelay={1000} copyIcon />
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

            <Modal isOpen={isOpen} onDismiss={() => setOpen(false)}>
              <ModalContent>
                <DashGrid>
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
                <StandardCursorListItem border={false}>
                  <TokenInfo
                    currency={
                      filteredSortedTokens.find(currency => currency.wrapped.symbol === modalAsset) ||
                      filteredSortedTokens[0]
                    }
                  />
                </StandardCursorListItem>
                <BoxPanelWithArrow bg="bg3">
                  <WalletUI
                    currency={
                      filteredSortedTokens.find(currency => currency.wrapped.symbol === modalAsset) ||
                      filteredSortedTokens[0]
                    }
                  />
                </BoxPanelWithArrow>
              </ModalContent>
            </Modal>
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

export default ArchwayWallet;
