import React, { useEffect, CSSProperties, useState, useCallback } from 'react';

import { Currency, Fraction, Token } from '@balancednetwork/sdk-core';
import { Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { isMobile } from 'react-device-detect';
import { MinusCircle } from 'react-feather';
import { Box, Flex } from 'rebass/styled-components';
import styled, { useTheme } from 'styled-components';

import CurrencyLogo from '@/app/components/CurrencyLogo';
import { DataText, List1, ListItem } from '@/app/components/List';
import { Typography } from '@/app/theme';
import useArrowControl from '@/hooks/useArrowControl';
import useKeyPress from '@/hooks/useKeyPress';
import useSortCurrency from '@/hooks/useSortCurrency';
import { useSignedInWallets } from '@/hooks/useWallets';
import { useRatesWithOracle } from '@/queries/reward';
import { useIsUserAddedToken } from '@/store/user/hooks';
import { useXCurrencyBalance } from '@/store/wallet/hooks';
import { formatBigNumber, toFraction } from '@/utils';
import { formatPrice } from '@/utils/formatter';
import { XChainId } from '@/xwagmi/types';
import { HeaderText } from './styleds';

const DashGrid = styled(Box)`
  display: grid;
  gap: 1em;
  align-items: center;
  grid-template-columns: repeat(2, 1fr);

  > * {
    justify-content: flex-end;
    &:first-child {
      justify-content: flex-start;
      text-align: left;
    }
  }
`;

function currencyKey(currency: Currency): string {
  return currency.isToken ? currency.address : 'ICX';
}

function CurrencyRow({
  currency,
  onSelect,
  isSelected,
  otherSelected,
  style,
  showCurrencyAmount,
  onRemove,
  account,
  isFocused,
  onFocus,
  rateFracs,
  selectedChainId,
}: {
  currency: Currency;
  onSelect: () => void;
  isSelected?: boolean;
  otherSelected?: boolean;
  style?: CSSProperties;
  showCurrencyAmount?: boolean;
  onRemove: () => void;
  account?: string | null;
  isFocused: boolean;
  onFocus: () => void;
  rateFracs: { [key in string]: Fraction } | undefined;
  selectedChainId: XChainId | undefined;
}) {
  const balance = useXCurrencyBalance(currency, selectedChainId);
  const signedInWallets = useSignedInWallets();

  const isUserAddedToken = useIsUserAddedToken(currency as Token);
  const theme = useTheme();

  // only show add or remove buttons if not on selected list
  const [show, setShow] = useState(false);
  const open = useCallback(() => setShow(true), []);
  const close = useCallback(() => setShow(false), []);

  const focusCombined = () => {
    onFocus();
    open();
  };

  const RowContentSignedIn = () => {
    return (
      <>
        <Flex alignItems={'center'}>
          <CurrencyLogo currency={currency} style={{ marginRight: '15px' }} />
          <Flex flexDirection="column">
            <Flex flexDirection="row">
              <DataText variant="p" fontWeight="bold">
                {currency?.symbol}
              </DataText>
              {currency?.symbol === 'BTCB' && <DataText style={{ marginLeft: '4px' }}>{`(old)`}</DataText>}
            </Flex>

            <Typography variant="span" fontSize={14} fontWeight={400} color="text2" display="block">
              {rateFracs && rateFracs[currency.symbol!] && formatPrice(rateFracs[currency.symbol!].toFixed(18))}
            </Typography>
          </Flex>
        </Flex>
        <Flex justifyContent="flex-end" alignItems="center">
          <DataText variant="p" textAlign="right">
            {balance?.isGreaterThan(0) ? formatBigNumber(balance, 'currency') : 0}

            {balance?.isGreaterThan(0) && rateFracs && rateFracs[currency.symbol!] && (
              <Typography variant="span" fontSize={14} color="text2" display="block">
                {`$${balance.times(new BigNumber(rateFracs[currency.symbol!].toFixed(8))).toFormat(2)}`}
              </Typography>
            )}
          </DataText>
          {isUserAddedToken && (isMobile || show) && (
            <MinusCircle
              color={theme.colors.alert}
              size={18}
              style={{ marginLeft: '12px' }}
              onClick={e => {
                e.stopPropagation();
                onRemove();
              }}
            />
          )}
        </Flex>
      </>
    );
  };

  const RowContentNotSignedIn = () => {
    return (
      <>
        <Flex>
          <CurrencyLogo currency={currency} style={{ marginRight: '8px' }} />
          <DataText variant="p" fontWeight="bold">
            {currency?.symbol}
          </DataText>
          {currency?.symbol === 'BTCB' && <DataText style={{ marginLeft: '4px' }}>{`(old)`}</DataText>}
        </Flex>
        <Flex justifyContent="flex-end" alignItems="center">
          <DataText variant="p" textAlign="right">
            {rateFracs && rateFracs[currency.symbol!] && formatPrice(rateFracs[currency.symbol!].toFixed(18))}
          </DataText>
          {isUserAddedToken && (isMobile || show) && (
            <MinusCircle
              color={theme.colors.alert}
              size={18}
              style={{ marginLeft: '12px' }}
              onClick={e => {
                e.stopPropagation();
                onRemove();
              }}
            />
          )}
        </Flex>
      </>
    );
  };

  return (
    <ListItem
      onClick={onSelect}
      {...(!isMobile ? { onMouseEnter: focusCombined } : null)}
      onMouseLeave={close}
      className={isFocused ? 'focused' : ''}
    >
      {signedInWallets.length > 0 ? <RowContentSignedIn /> : <RowContentNotSignedIn />}
    </ListItem>
  );
}

export default function CurrencyList({
  currencies,
  onCurrencySelect,
  otherCurrency,
  showImportView,
  setImportToken,
  showRemoveView,
  setRemoveToken,
  showCurrencyAmount,
  account,
  isOpen,
  onDismiss,
  selectedChainId,
}: {
  currencies: Currency[];
  onCurrencySelect: (currency: Currency) => void;
  otherCurrency?: Currency | null;
  showImportView: () => void;
  setImportToken: (token: Token) => void;
  showRemoveView: () => void;
  setRemoveToken: (token: Token) => void;
  showCurrencyAmount?: boolean;
  account?: string | null;
  isOpen: boolean;
  onDismiss: () => void;
  selectedChainId: XChainId | undefined;
}) {
  const enter = useKeyPress('Enter');
  const handleEscape = useKeyPress('Escape');
  const { activeIndex, setActiveIndex } = useArrowControl(isOpen, currencies?.length || 0);
  const signedInWallets = useSignedInWallets();

  const rates = useRatesWithOracle();
  const rateFracs = React.useMemo(() => {
    if (rates) {
      return Object.keys(rates).reduce((acc, key) => {
        acc[key] = toFraction(rates[key]);
        return acc;
      }, {});
    }
  }, [rates]);

  const { sortBy, handleSortSelect, sortData } = useSortCurrency({ key: 'symbol', order: 'ASC' }, selectedChainId);
  const sortedCurrencies = React.useMemo(() => {
    if (currencies && rateFracs) {
      return sortData(currencies, rateFracs);
    }
  }, [currencies, rateFracs, sortData]);

  useEffect(() => {
    if (isOpen) {
      setActiveIndex(undefined);
    }
  }, [isOpen, setActiveIndex]);

  useEffect(() => {
    if (isOpen && enter && currencies?.length && activeIndex !== undefined) {
      onCurrencySelect(currencies[activeIndex]);
    }
  }, [isOpen, activeIndex, enter, currencies, currencies.length, onCurrencySelect]);

  useEffect(() => {
    if (isOpen && handleEscape) {
      onDismiss();
    }
  }, [isOpen, handleEscape, onDismiss]);

  return (
    <List1 mt={4}>
      <DashGrid>
        <HeaderText
          role="button"
          className={sortBy.key === 'symbol' ? sortBy.order : ''}
          onClick={() =>
            handleSortSelect({
              key: 'symbol',
            })
          }
        >
          <span>
            <Trans>Asset</Trans>
          </span>
        </HeaderText>
        {signedInWallets.length > 0 ? (
          <HeaderText
            role="button"
            className={sortBy.key === 'value' ? sortBy.order : ''}
            onClick={() =>
              handleSortSelect({
                key: 'value',
              })
            }
          >
            <Trans>Wallet</Trans>
          </HeaderText>
        ) : (
          <HeaderText
            role="button"
            className={sortBy.key === 'price' ? sortBy.order : ''}
            onClick={() =>
              handleSortSelect({
                key: 'price',
              })
            }
          >
            <Trans>Price</Trans>
          </HeaderText>
        )}
      </DashGrid>

      {sortedCurrencies?.map((currency, index) => (
        <CurrencyRow
          account={account}
          key={currencyKey(currency)}
          currency={currency}
          onSelect={() => onCurrencySelect(currency)}
          onRemove={() => {
            setRemoveToken(currency as Token);
            showRemoveView();
          }}
          isFocused={index === activeIndex}
          onFocus={() => setActiveIndex(index)}
          rateFracs={rateFracs}
          selectedChainId={selectedChainId}
        />
      ))}
    </List1>
  );
}
