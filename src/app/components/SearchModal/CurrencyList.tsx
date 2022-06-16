import React, { useEffect, CSSProperties, useState, useCallback } from 'react';

import { Currency, Token } from '@balancednetwork/sdk-core';
import { Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { isMobile } from 'react-device-detect';
import { MinusCircle } from 'react-feather';
import { Flex } from 'rebass/styled-components';
import { useTheme } from 'styled-components';

import CurrencyLogo from 'app/components/CurrencyLogo';
import { ListItem, DashGrid, HeaderText, DataText, List1 } from 'app/components/List';
import useArrowControl from 'hooks/useArrowControl';
import useKeyPress from 'hooks/useKeyPress';
import { useIsUserAddedToken } from 'store/user/hooks';
import { useCurrencyBalance } from 'store/wallet/hooks';

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
}) {
  const balance = useCurrencyBalance(account ?? undefined, currency);
  const isUserAddedToken = useIsUserAddedToken(currency as Token);
  const theme = useTheme();

  // only show add or remove buttons if not on selected list
  const [show, setShow] = useState(false);
  const open = useCallback(() => setShow(true), [setShow]);
  const close = useCallback(() => setShow(false), [setShow]);

  const focusCombined = () => {
    onFocus();
    open();
  };

  return (
    <ListItem
      onClick={onSelect}
      {...(!isMobile ? { onMouseEnter: focusCombined } : null)}
      onMouseLeave={close}
      className={isFocused ? 'focused' : ''}
    >
      <Flex>
        <CurrencyLogo currency={currency} style={{ marginRight: '8px' }} />
        <DataText variant="p" fontWeight="bold">
          {currency?.symbol}
        </DataText>
      </Flex>
      <Flex justifyContent="flex-end" alignItems="center">
        <DataText variant="p" textAlign="right">
          {new BigNumber(balance?.toSignificant(4) || 0).toFormat()}
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
    </ListItem>
  );
}

export default function CurrencyList({
  currencies,
  selectedCurrency,
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
}: {
  currencies: Currency[];
  selectedCurrency?: Currency | null;
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
}) {
  const enter = useKeyPress('Enter');
  const escape = useKeyPress('Escape');
  const { activeIndex, setActiveIndex } = useArrowControl(isOpen, currencies?.length || 0);

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
    if (isOpen && escape) {
      onDismiss();
    }
  }, [isOpen, escape, onDismiss]);

  return (
    <List1 mt={4}>
      <DashGrid>
        <HeaderText>
          <Trans>Asset</Trans>
        </HeaderText>
        <HeaderText textAlign="right">
          <Trans>Wallet</Trans>
        </HeaderText>
      </DashGrid>

      {currencies.map((currency, index) => (
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
        />
      ))}
    </List1>
  );
}
