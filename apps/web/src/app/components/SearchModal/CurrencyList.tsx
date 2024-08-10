import React, { useEffect, CSSProperties, useState, useCallback, useMemo } from 'react';

import { Currency, Fraction, Token } from '@balancednetwork/sdk-core';
import { Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { isMobile } from 'react-device-detect';
import { MinusCircle } from 'react-feather';
import { Box, Flex } from 'rebass/styled-components';
import styled, { useTheme } from 'styled-components';

import CurrencyLogo from '@/app/components/CurrencyLogo';
import { ListItem, DataText, List1 } from '@/app/components/List';
import { Typography } from '@/app/theme';
import useKeyPress from '@/hooks/useKeyPress';
import { useRatesWithOracle } from '@/queries/reward';
import { useIsUserAddedToken } from '@/store/user/hooks';
import { useXCurrencyBalance } from '@/store/wallet/hooks';
import { formatBigNumber, toFraction } from '@/utils';
import useSortCurrency from '@/hooks/useSortCurrency';
import { HeaderText } from '@/app/pages/trade/supply/_components/AllPoolsPanel';
import { useSignedInWallets } from '@/app/pages/trade/bridge/_hooks/useWallets';
import { XChainId } from '@/app/pages/trade/bridge/types';
import { formatPrice } from '@/utils/formatter';
import { useCurrencyXChains } from '@/store/bridge/hooks';
import { BalanceBreakdown } from '../Wallet/styledComponents';
import { xChainMap } from '@/app/pages/trade/bridge/_config/xChains';
import CurrencyXChainItem from './CurrencyXChainItem';

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

const StyledBalanceBreakdown = styled(BalanceBreakdown)`
  margin-top: 18px;
  grid-column: span 2;
  color: ${({ theme }) => theme.colors.text2};
`;

function currencyKey(currency: Currency): string {
  return currency.isToken ? currency.address : 'ICX';
}

const MemoizedCurrencyXChainItem = React.memo(CurrencyXChainItem);

function CurrencyRow({
  currency,
  onSelect,
  onChainSelect,
  isSelected,
  otherSelected,
  style,
  showCurrencyAmount,
  onRemove,
  account,
  rateFracs,
  selectedChainId,
  showCrossChainBreakdown,
}: {
  currency: Currency;
  showCrossChainBreakdown: boolean;
  onSelect: (currency: Currency, setDefaultChain?: boolean) => void;
  onChainSelect?: (chainId: XChainId) => void;
  isSelected?: boolean;
  otherSelected?: boolean;
  style?: CSSProperties;
  showCurrencyAmount?: boolean;
  onRemove: () => void;
  account?: string | null;
  rateFracs: { [key in string]: Fraction } | undefined;
  selectedChainId: XChainId | undefined;
}) {
  const currencyXChains = useCurrencyXChains(currency);
  const isSingleChain = currencyXChains.length === 1 || currencyXChains.length === 0;
  const showBreakdown = showCrossChainBreakdown && currencyXChains.length && !isSingleChain;
  const balance = useXCurrencyBalance(currency, selectedChainId);
  const signedInWallets = useSignedInWallets();

  const sortedXChains = useMemo(() => {
    return [...currencyXChains].sort((a, b) => {
      return xChainMap[a].name.localeCompare(xChainMap[b].name);
    });
  }, [currencyXChains]);

  const isUserAddedToken = useIsUserAddedToken(currency as Token);
  const theme = useTheme();

  // only show add or remove buttons if not on selected list
  const [show, setShow] = useState(false);
  const open = useCallback(() => setShow(true), []);
  const close = useCallback(() => setShow(false), []);

  const focusCombined = () => {
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
            <Typography variant="span" fontSize={16} color="text" display="block">
              {balance?.isGreaterThan(0) ? formatBigNumber(balance, 'currency') : 0}
            </Typography>

            {balance && balance.isGreaterThan(0) && rateFracs && rateFracs[currency.symbol!] ? (
              <Typography variant="span" fontSize={14} color="text2" display="block">
                {`$${balance.times(new BigNumber(rateFracs[currency.symbol!].toFixed(8))).toFormat(2)}`}
              </Typography>
            ) : null}
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
          <CurrencyLogo currency={currency} style={{ marginRight: '15px' }} />
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

  const handleXChainCurrencySelect = useCallback(
    (currency: Currency, xChainId: XChainId) => {
      onSelect(currency, false);
      onChainSelect && onChainSelect(xChainId);
    },
    [onChainSelect, onSelect],
  );

  return (
    <>
      <ListItem
        onClick={() => onSelect(currency)}
        {...(!isMobile ? { onMouseEnter: open } : null)}
        onMouseLeave={close}
        $hideBorder={!!showBreakdown}
      >
        {signedInWallets.length > 0 ? <RowContentSignedIn /> : <RowContentNotSignedIn />}
      </ListItem>

      {showBreakdown ? (
        <StyledBalanceBreakdown $arrowPosition={currency.symbol ? `${currency.symbol.length * 5 + 26}px` : '40px'}>
          {sortedXChains.map(xChainId => (
            <MemoizedCurrencyXChainItem
              key={`${currency.symbol}-${xChainId}`}
              xChainId={xChainId}
              currency={currency}
              price={rateFracs && rateFracs[currency.symbol!] ? rateFracs[currency.symbol!].toFixed(18) : '0'}
              onSelect={handleXChainCurrencySelect}
            />
          ))}
        </StyledBalanceBreakdown>
      ) : null}
    </>
  );
}

export default function CurrencyList({
  currencies,
  showCrossChainBreakdown = true,
  onCurrencySelect,
  onChainSelect,
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
  showCrossChainBreakdown: boolean;
  onCurrencySelect: (currency: Currency, setDefaultChain?: boolean) => void;
  onChainSelect?: (chainId: XChainId) => void;
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
  const handleEscape = useKeyPress('Escape');
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
          onSelect={onCurrencySelect}
          onChainSelect={onChainSelect}
          onRemove={() => {
            setRemoveToken(currency as Token);
            showRemoveView();
          }}
          rateFracs={rateFracs}
          selectedChainId={selectedChainId}
          showCrossChainBreakdown={showCrossChainBreakdown}
        />
      ))}
    </List1>
  );
}
