import React, { useEffect, useState, useCallback, useMemo } from 'react';

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
import useKeyPress from '@/hooks/useKeyPress';
import useSortCurrency from '@/hooks/useSortCurrency';
import { useHasSignedIn } from '@/hooks/useWallets';
import { useRatesWithOracle } from '@/queries/reward';
import { useBridgeDirection } from '@/store/bridge/hooks';
import { useIsUserAddedToken } from '@/store/user/hooks';
import { useCrossChainWalletBalances, useXCurrencyBalance } from '@/store/wallet/hooks';
import { formatBigNumber, toFraction } from '@/utils';
import { formatPrice } from '@/utils/formatter';
import { ICON_XCALL_NETWORK_ID } from '@/xwagmi/constants';
import { xChainMap } from '@/xwagmi/constants/xChains';
import { XChainId } from '@/xwagmi/types';
import { getSupportedXChainIdsForToken } from '@/xwagmi/xcall/utils';
import { ChainLogo } from '../ChainLogo';
import CurrencyLogoWithNetwork from '../CurrencyLogoWithNetwork';
import { MouseoverTooltip } from '../Tooltip';
import { BalanceBreakdown } from '../Wallet/styledComponents';
import { SelectorType } from './CurrencySearch';
import CurrencyXChainItem from './CurrencyXChainItem';
import { HeaderText, XChainLogoList } from './styleds';

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
  selectorType,
  width,
}: {
  currency: Currency;
  showCrossChainBreakdown: boolean;
  onSelect: (currency: Currency, setDefaultChain?: boolean) => void;
  onChainSelect?: (chainId: XChainId) => void;
  onRemove: () => void;
  rateFracs: { [key in string]: Fraction } | undefined;
  selectedChainId: XChainId | undefined;
  basedOnWallet: boolean;
  selectorType: SelectorType;
  width?: number;
}) {
  const currencyXChainIds = useMemo(() => getSupportedXChainIdsForToken(currency), [currency]);
  const balance = useXCurrencyBalance(currency, selectedChainId);
  const hasSigned = useHasSignedIn();
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

  const shouldForceNetworkIcon =
    selectorType === SelectorType.SUPPLY_BASE || selectorType === SelectorType.SUPPLY_QUOTE || SelectorType.BRIDGE;

  const bridgeDirection = useBridgeDirection();
  const finalXChainIds = useMemo(() => {
    if (
      shouldForceNetworkIcon &&
      (selectorType === SelectorType.SUPPLY_BASE || selectorType === SelectorType.SUPPLY_QUOTE)
    ) {
      return [ICON_XCALL_NETWORK_ID];
    }

    if (shouldForceNetworkIcon && selectorType === SelectorType.BRIDGE) {
      return [bridgeDirection.from];
    }

    return sortedXChains;
  }, [sortedXChains, shouldForceNetworkIcon, selectorType, bridgeDirection.from]);

  const RowContentSignedIn = () => {
    return (
      <>
        <Flex alignItems={'center'}>
          {(basedOnWallet || shouldForceNetworkIcon) && finalXChainIds.length === 1 ? (
            <CurrencyLogoWithNetwork
              currency={currency}
              bgColor={theme.colors.bg4}
              chainId={finalXChainIds[0]}
              size={'24px'}
            />
          ) : finalXChainIds.length === 0 && showCrossChainBreakdown ? (
            <CurrencyLogoWithNetwork
              currency={currency}
              bgColor={theme.colors.bg4}
              chainId={ICON_XCALL_NETWORK_ID}
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
          {sortedXChains.length === 0 && showCrossChainBreakdown ? (
            <CurrencyLogoWithNetwork
              currency={currency}
              bgColor={theme.colors.bg4}
              chainId={ICON_XCALL_NETWORK_ID}
              size={'24px'}
            />
          ) : shouldForceNetworkIcon && finalXChainIds.length === 1 ? (
            <CurrencyLogoWithNetwork
              currency={currency}
              bgColor={theme.colors.bg4}
              chainId={finalXChainIds[0]}
              size={'24px'}
            />
          ) : (
            <CurrencyLogo currency={currency} />
          )}

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

  const handleXChainCurrencySelect = useCallback(
    (currency: Currency, xChainId: XChainId) => {
      onSelect(currency, false);
      onChainSelect && onChainSelect(xChainId);
    },
    [onChainSelect, onSelect],
  );

  const handleClick = (currency: Currency, XChainIds: XChainId[]) => {
    if (basedOnWallet && XChainIds.length === 1) {
      handleXChainCurrencySelect(currency, XChainIds[0]);
    } else {
      onSelect(currency);
    }
  };

  if (hideBecauseOfLowValue) return null;
  return (
    <>
      <ListItem
        style={{ display: 'flex', justifyContent: 'space-between', width: width ? `${width + 50}` : 'auto' }}
        onClick={() => handleClick(currency, finalXChainIds)}
        {...(!isMobile ? { onMouseEnter: open } : null)}
        onMouseLeave={close}
        $hideBorder={!!showBreakdown}
      >
        {hasSigned && basedOnWallet ? <RowContentSignedIn /> : <RowContentNotSignedIn />}
      </ListItem>

      {showBreakdown ? (
        <StyledBalanceBreakdown $arrowPosition={currency.symbol ? `${currency.symbol.length * 5 + 26}px` : '40px'}>
          {basedOnWallet ? (
            finalXChainIds.map(xChainId => (
              <MemoizedCurrencyXChainItem
                key={`${currency.symbol}-${xChainId}`}
                xChainId={xChainId}
                currency={currency}
                price={rateFracs && rateFracs[currency.symbol!] ? rateFracs[currency.symbol!].toFixed(18) : '0'}
                onSelect={handleXChainCurrencySelect}
              />
            ))
          ) : (
            <XChainLogoList>
              {sortedXChains?.map(xChainId =>
                isMobile ? (
                  <Box key={xChainId} onClick={() => handleXChainCurrencySelect(currency, xChainId)}>
                    <ChainLogo chain={xChainMap[xChainId]} size="18px" />
                  </Box>
                ) : (
                  <MouseoverTooltip key={xChainId} text={xChainMap[xChainId].name} autoWidth placement="bottom">
                    <Box style={{ cursor: 'pointer' }} onClick={() => handleXChainCurrencySelect(currency, xChainId)}>
                      <ChainLogo chain={xChainMap[xChainId]} size="18px" />
                    </Box>
                  </MouseoverTooltip>
                ),
              )}
            </XChainLogoList>
          )}
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
  showRemoveView,
  setRemoveToken,
  isOpen,
  onDismiss,
  selectedChainId,
  basedOnWallet,
  selectorType,
  width,
}: {
  currencies: Currency[];
  showCrossChainBreakdown: boolean;
  onCurrencySelect: (currency: Currency, setDefaultChain?: boolean) => void;
  onChainSelect?: (chainId: XChainId) => void;
  showRemoveView: () => void;
  setRemoveToken: (token: Token) => void;
  isOpen: boolean;
  onDismiss: () => void;
  selectedChainId: XChainId | undefined;
  basedOnWallet: boolean;
  selectorType: SelectorType;
  width?: number;
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (basedOnWallet) {
      handleSortSelect({
        key: 'value',
        order: 'DESC',
      });
    } else {
      handleSortSelect({
        key: 'symbol',
        order: 'ASC',
      });
    }
  }, [basedOnWallet, hasSignedIn]);

  return (
    <List1 mt={3}>
      <DashGrid width={width ? `${width + 50}` : 'auto'}>
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
        {hasSignedIn && basedOnWallet ? (
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
          selectorType={selectorType}
          width={width}
        />
      ))}
    </List1>
  );
}
