import React from 'react';

import { Flex } from 'rebass/styled-components';

import CurrencyLogo from 'app/components/CurrencyLogo';
import { ListItem, DashGrid, HeaderText, DataText, List1 } from 'app/components/List';
import { Currency, Token } from 'types/balanced-sdk-core';

export default function CurrencyList({
  currencies,
  selectedCurrency,
  onCurrencySelect,
  otherCurrency,
  showImportView,
  setImportToken,
  showCurrencyAmount,
}: {
  currencies: Currency[];
  selectedCurrency?: Currency | null;
  onCurrencySelect: (currency: Currency) => void;
  otherCurrency?: Currency | null;
  showImportView: () => void;
  setImportToken: (token: Token) => void;
  showCurrencyAmount?: boolean;
}) {
  return (
    <List1 mt={4}>
      <DashGrid>
        <HeaderText>Asset</HeaderText>
        <HeaderText textAlign="right">Balance</HeaderText>
      </DashGrid>

      {currencies.map(ccy => (
        <ListItem key={(ccy as Token).address} onClick={() => onCurrencySelect(ccy)}>
          <Flex>
            <CurrencyLogo currency={ccy} style={{ marginRight: '8px' }} />
            <DataText variant="p" fontWeight="bold">
              {ccy?.symbol}
            </DataText>
          </Flex>
          <DataText variant="p" textAlign="right">
            {/* {balanceList1[ccy?.symbol!]?.dp(2).toFormat()} */}
          </DataText>
        </ListItem>
      ))}
    </List1>
  );
}
