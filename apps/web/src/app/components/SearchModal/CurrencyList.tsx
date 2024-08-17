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
import { useCrossChainWalletBalances, useXCurrencyBalance } from '@/store/wallet/hooks';
import { formatBigNumber, toFraction } from '@/utils';
import useSortCurrency from '@/hooks/useSortCurrency';
import { HeaderText } from '@/app/pages/trade/supply/_components/AllPoolsPanel';
import { useSignedInWallets } from '@/app/pages/trade/bridge/_hooks/useWallets';
import { XChainId } from '@/app/pages/trade/bridge/types';
import { formatPrice } from '@/utils/formatter';
import { BalanceBreakdown } from '../Wallet/styledComponents';
import { xChainMap } from '@/app/pages/trade/bridge/_config/xChains';
import CurrencyXChainItem from './CurrencyXChainItem';
import CurrencyLogoWithNetwork from '../CurrencyLogoWithNetwork';
import { getSupportedXChainIdsForToken } from '@/app/pages/trade/bridge/utils';

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
}: {
  currency: Currency;
  showCrossChainBreakdown: boolean;
  onSelect: (currency: Currency, setDefaultChain?: boolean) => void;
  onChainSelect?: (chainId: XChainId) => void;
  onRemove: () => void;
  rateFracs: { [key in string]: Fraction } | undefined;
  selectedChainId: XChainId | undefined;
  basedOnWallet: boolean;
}) {
  const currencyXChainIds = useMemo(() => getSupportedXChainIdsForToken(currency), [currency]);
  const balance = useXCurrencyBalance(currency, selectedChainId);
  const signedInWallets = useSignedInWallets();
  const xWallet = useCrossChainWalletBalances();

  const sortedXChains = useMemo(() => {
    return basedOnWallet
      ? [...currencyXChainIds]
          .filter(xChainId => {
            const xCurrencyAmount = Object.values(xWallet[xChainId] || {}).find(
              currencyAmount => currencyAmount.currency.symbol === currency.symbol,
            );
            return xCurrencyAmount?.greaterThan(0);
          })
          .sort((xChainIdA, xChainIdAB) => {
            const xCurrencyAmountA = Object.values(xWallet[xChainIdA] || {}).find(
              currencyAmount => currencyAmount.currency.symbol === currency.symbol,
            );
            const xCurrencyAmountB = Object.values(xWallet[xChainIdAB] || {}).find(
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
  }, [currencyXChainIds, basedOnWallet, currency, xWallet]);

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
          {basedOnWallet && sortedXChains.length === 1 ? (
            <CurrencyLogoWithNetwork
              currency={currency}
              bgColor={theme.colors.bg4}
              chainId={sortedXChains[0]}
              size={'24px'}
            />
          ) : (
            <CurrencyLogo currency={currency} />
          )}

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
              {balance?.isGreaterThan(0) ? formatBigNumber(balance, 'currency') : 0}
            </Typography>

            {balance && balance.isGreaterThan(0) && price ? (
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

  const handleClick = (currency: Currency, sortedXChains: XChainId[]) => {
    if (basedOnWallet && sortedXChains.length === 1) {
      handleXChainCurrencySelect(currency, sortedXChains[0]);
    } else {
      onSelect(currency);
    }
  };

  if (hideBecauseOfLowValue) return null;
  return (
    <>
      <ListItem
        onClick={() => handleClick(currency, sortedXChains)}
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
              basedOnWallet={basedOnWallet}
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
  basedOnWallet,
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
  basedOnWallet: boolean;
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
        {signedInWallets.length > 0 ? (
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

      {sortedCurrencies?.map((currency, index) => (
        <CurrencyRow
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
          basedOnWallet={basedOnWallet}
        />
      ))}
    </List1>
  );
}
