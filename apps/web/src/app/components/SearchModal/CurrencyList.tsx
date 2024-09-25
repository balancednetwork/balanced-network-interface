import React, { useEffect, useState, useCallback, useMemo } from 'react';

import { Currency, Fraction, Token, XToken } from '@balancednetwork/sdk-core';
import { Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { isMobile } from 'react-device-detect';
import { MinusCircle } from 'react-feather';
import { Box, Flex } from 'rebass/styled-components';
import styled, { useTheme } from 'styled-components';

import CurrencyLogo from '@/app/components/CurrencyLogo';
import { DataText, List1, ListItem } from '@/app/components/List';
import { Typography } from '@/app/theme';
import useKeyPress from '@/hooks/useKeyPress';
import useSortCurrency from '@/hooks/useSortCurrency';
import { useHasSignedIn } from '@/hooks/useWallets';
import { useRatesWithOracle } from '@/queries/reward';
import { useBridgeDirection } from '@/store/bridge/hooks';
import { useIsUserAddedToken } from '@/store/user/hooks';
import { useWalletBalances, useXCurrencyBalance } from '@/store/wallet/hooks';
import { formatBigNumber, toFraction } from '@/utils';
import { formatPrice } from '@/utils/formatter';
import { ICON_XCALL_NETWORK_ID } from '@/xwagmi/constants';
import { xChainMap } from '@/xwagmi/constants/xChains';
import { getSupportedXChainIdsForToken } from '@/xwagmi/xcall/utils';
import { XChainId } from '@balancednetwork/sdk-core';
import CurrencyLogoWithNetwork from '../CurrencyLogoWithNetwork';
import { HeaderText } from '../HeaderText';
import { BalanceBreakdown } from '../Wallet/styledComponents';
import { SelectorType } from './CurrencySearch';
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

const StyledHeaderText = styled(HeaderText)`
  font-size: 12px;
`;

function currencyKey(currency: Currency): string {
  return currency.isToken ? currency.address : 'ICX';
}

const MemoizedCurrencyXChainItem = React.memo(CurrencyXChainItem);

function CurrencyRow({
  currency,
  onSelect,
  onChainSelect,
  onRemove,
  rateFracs,
  selectedChainId,
  showCrossChainBreakdown,
  basedOnWallet,
  selectorType,
}: {
  currency: XToken;
  showCrossChainBreakdown: boolean;
  onSelect: (currency: XToken) => void;
  onChainSelect?: (chainId: XChainId) => void;
  onRemove: () => void;
  rateFracs: { [key in string]: Fraction } | undefined;
  selectedChainId: XChainId | undefined;
  basedOnWallet: boolean;
  selectorType: SelectorType;
}) {
  const currencyXChainIds = useMemo(() => getSupportedXChainIdsForToken(currency), [currency]);
  const balance = useXCurrencyBalance(currency, selectedChainId);
  const hasSigned = useHasSignedIn();
  const walletBalances = useWalletBalances();

  const sortedXChains = useMemo(() => {
    return basedOnWallet
      ? [...currencyXChainIds]
          .filter(xChainId => {
            const xCurrencyAmount = Object.values(walletBalances[xChainId] || {}).find(
              currencyAmount => currencyAmount.currency.symbol === currency.symbol,
            );
            return xCurrencyAmount?.greaterThan(0);
          })
          .sort((xChainIdA, xChainIdAB) => {
            const xCurrencyAmountA = Object.values(walletBalances[xChainIdA] || {}).find(
              currencyAmount => currencyAmount.currency.symbol === currency.symbol,
            );
            const xCurrencyAmountB = Object.values(walletBalances[xChainIdAB] || {}).find(
              currencyAmount => currencyAmount.currency.symbol === currency.symbol,
            );

            if (xCurrencyAmountA && xCurrencyAmountB) {
              const amountA = new BigNumber(xCurrencyAmountA.toFixed());
              const amountB = new BigNumber(xCurrencyAmountB.toFixed());
              return amountB.comparedTo(amountA);
            }

            return 0;
          })
      : [...currencyXChainIds].sort((a, b) => {
          return xChainMap[a].name.localeCompare(xChainMap[b].name);
        });
  }, [currencyXChainIds, basedOnWallet, currency, walletBalances]);

  const isSingleChain = sortedXChains.length === 1 || sortedXChains.length === 0;
  const showBreakdown = showCrossChainBreakdown && currencyXChainIds.length && !isSingleChain;

  const isUserAddedToken = useIsUserAddedToken(currency as Token);
  const theme = useTheme();

  // only show add or remove buttons if not on selected list
  const [show, setShow] = useState(false);
  const open = useCallback(() => setShow(true), []);
  const close = useCallback(() => setShow(false), []);
  const price = rateFracs && new BigNumber(rateFracs[currency.symbol!]?.toFixed(8));
  const hideBecauseOfLowValue =
    basedOnWallet &&
    (price && !price.isNaN() ? basedOnWallet && balance?.times(price).isLessThan(0.01) : balance?.isLessThan(0.01));

  const RowContentSignedIn = () => {
    return (
      <>
        <Flex alignItems={'center'}>
          <CurrencyLogoWithNetwork currency={currency} bgColor={theme.colors.bg4} size={'24px'} />

          <Flex flexDirection="column" ml={'15px'}>
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
              {balance?.isGreaterThan(0) ? formatBigNumber(balance, 'currency') : '-'}
            </Typography>

            {balance && balance.isGreaterThan(0) && price && !price.isNaN() ? (
              <Typography variant="span" fontSize={14} color="text2" display="block">
                {`$${balance.times(price).toFormat(2)}`}
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
          <CurrencyLogoWithNetwork currency={currency} bgColor={theme.colors.bg4} size={'24px'} />

          <DataText variant="p" fontWeight="bold" ml={'15px'}>
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

  const handleClick = (currency: XToken) => {
    onSelect(currency);
  };

  if (hideBecauseOfLowValue) return null;
  return (
    <>
      <ListItem
        onClick={() => handleClick(currency)}
        {...(!isMobile ? { onMouseEnter: open } : null)}
        onMouseLeave={close}
        $hideBorder={!!showBreakdown}
      >
        {hasSigned ? <RowContentSignedIn /> : <RowContentNotSignedIn />}
      </ListItem>

      {/* {showBreakdown ? (
        <StyledBalanceBreakdown $arrowPosition={currency.symbol ? `${currency.symbol.length * 5 + 26}px` : '40px'}>
          {finalXChainIds.map(xChainId => (
            <MemoizedCurrencyXChainItem
              key={`${currency.symbol}-${xChainId}`}
              xChainId={xChainId}
              currency={currency}
              price={rateFracs && rateFracs[currency.symbol!] ? rateFracs[currency.symbol!].toFixed(18) : '0'}
              onSelect={handleXChainCurrencySelect}
            />
          ))}
        </StyledBalanceBreakdown>
      ) : null} */}
    </>
  );
}

export default function CurrencyList({
  currencies,
  showCrossChainBreakdown = true,
  onCurrencySelect,
  onChainSelect,
  showRemoveView,
  setRemoveToken,
  isOpen,
  onDismiss,
  selectedChainId,
  basedOnWallet,
  selectorType,
}: {
  currencies: XToken[];
  showCrossChainBreakdown: boolean;
  onCurrencySelect: (currency: XToken) => void;
  onChainSelect?: (chainId: XChainId) => void;
  showRemoveView: () => void;
  setRemoveToken: (token: XToken) => void;
  isOpen: boolean;
  onDismiss: () => void;
  selectedChainId: XChainId | undefined;
  basedOnWallet: boolean;
  selectorType: SelectorType;
}) {
  const handleEscape = useKeyPress('Escape');
  const hasSignedIn = useHasSignedIn();

  const rates = useRatesWithOracle();
  const rateFracs = React.useMemo(() => {
    if (rates) {
      return Object.keys(rates).reduce((acc, key) => {
        acc[key] = toFraction(rates[key]);
        return acc;
      }, {});
    }
  }, [rates]);

  const { sortBy, handleSortSelect, sortData } = useSortCurrency({ key: 'symbol', order: 'ASC' });
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
    <List1 mt={3}>
      <DashGrid>
        <StyledHeaderText
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
        </StyledHeaderText>
        {hasSignedIn ? (
          <StyledHeaderText
            role="button"
            className={sortBy.key === 'value' ? sortBy.order : ''}
            onClick={() =>
              handleSortSelect({
                key: 'value',
              })
            }
          >
            <Trans>Wallet</Trans>
          </StyledHeaderText>
        ) : (
          <StyledHeaderText
            role="button"
            className={sortBy.key === 'price' ? sortBy.order : ''}
            onClick={() =>
              handleSortSelect({
                key: 'price',
              })
            }
          >
            <Trans>Price</Trans>
          </StyledHeaderText>
        )}
      </DashGrid>

      {sortedCurrencies?.map(currency => (
        <CurrencyRow
          key={currencyKey(currency)}
          currency={currency}
          onSelect={onCurrencySelect}
          onChainSelect={onChainSelect}
          onRemove={() => {
            setRemoveToken(currency);
            showRemoveView();
          }}
          rateFracs={rateFracs}
          selectedChainId={selectedChainId}
          showCrossChainBreakdown={showCrossChainBreakdown}
          basedOnWallet={basedOnWallet}
          selectorType={selectorType}
        />
      ))}
    </List1>
  );
}
