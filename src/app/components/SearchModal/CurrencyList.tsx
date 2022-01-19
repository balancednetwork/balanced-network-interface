import React, { CSSProperties, useState, useCallback } from 'react';

import BigNumber from 'bignumber.js';
import { isIOS, isMobile } from 'react-device-detect';
import { MinusCircle } from 'react-feather';
import { Flex } from 'rebass/styled-components';
import { useTheme } from 'styled-components';

import CurrencyLogo from 'app/components/CurrencyLogo';
import { ListItem, DashGrid, HeaderText, DataText, List1 } from 'app/components/List';
import { useIsUserAddedToken } from 'store/user/hooks';
import { useCurrencyBalance } from 'store/wallet/hooks';
import { Currency, Token } from 'types/balanced-sdk-core';

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
}: {
  currency: Currency;
  onSelect: () => void;
  isSelected?: boolean;
  otherSelected?: boolean;
  style?: CSSProperties;
  showCurrencyAmount?: boolean;
  onRemove: () => void;
  account?: string | null;
}) {
  const balance = useCurrencyBalance(account ?? undefined, currency);
  const isUserAddedToken = useIsUserAddedToken(currency as Token);
  const theme = useTheme();

  // only show add or remove buttons if not on selected list
  const [show, setShow] = useState(false);
  const open = useCallback(() => setShow(true), [setShow]);
  const close = useCallback(() => setShow(false), [setShow]);

  return (
    <ListItem onClick={onSelect} {...(!isIOS ? { onMouseEnter: open } : null)} onMouseLeave={close}>
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
}) {
  return (
    <List1 mt={4}>
      <DashGrid>
        <HeaderText>Asset</HeaderText>
        <HeaderText textAlign="right">Wallet</HeaderText>
      </DashGrid>

      {currencies.map(currency => (
        <CurrencyRow
          account={account}
          key={currencyKey(currency)}
          currency={currency}
          onSelect={() => onCurrencySelect(currency)}
          onRemove={() => {
            setRemoveToken(currency as Token);
            showRemoveView();
          }}
        />
      ))}
    </List1>
  );
}
