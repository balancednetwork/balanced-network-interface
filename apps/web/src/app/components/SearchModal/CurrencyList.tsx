// @ts-nocheck
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
import { toFraction } from '@/utils';
import { formatBalance, formatPrice, formatSymbol, formatValue } from '@/utils/formatter';
import { ICON_XCALL_NETWORK_ID } from '@balancednetwork/xwagmi';
import { xChainMap } from '@balancednetwork/xwagmi';
import { xTokenMap } from '@balancednetwork/xwagmi';
import { XChainId } from '@balancednetwork/xwagmi';
import { getSupportedXChainIdsForSwapToken } from '@balancednetwork/xwagmi';
import { ChainLogo } from '../ChainLogo';
import CurrencyLogoWithNetwork from '../CurrencyLogoWithNetwork';
import { MouseoverTooltip } from '../Tooltip';
import { BalanceBreakdown } from '../Wallet/styledComponents';
import { SelectorType } from './CurrencySearch';
import CurrencyXChainItem from './CurrencyXChainItem';
import { HeaderText, XChainLogoList } from './styleds';
import { currencyKey, shouldHideBecauseOfLowValue } from './utils';

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
  filterState,
}: {
  currency: Currency;
  filterState: XChainId[];
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
  const currencyXChainIds = useMemo(() => getSupportedXChainIdsForSwapToken(currency), [currency]);
  const balance = useXCurrencyBalance(currency, selectedChainId);
  const hasSigned = useHasSignedIn();
  const xWallet = useCrossChainWalletBalances();
  const isSwapSelector = selectorType === SelectorType.SWAP_IN || selectorType === SelectorType.SWAP_OUT;
  const prices = useRatesWithOracle();

  const sortedXChains = useMemo(() => {
    return basedOnWallet
      ? [...currencyXChainIds]
          .filter(xChainId => {
            const xCurrencyAmount = Object.values(xWallet[xChainId] || {}).find(
              currencyAmount => currencyAmount.currency.symbol === currency.symbol,
            );
            return prices
              ? xCurrencyAmount?.greaterThan(0) &&
                  !shouldHideBecauseOfLowValue(
                    true,
                    prices[currency.symbol!],
                    new BigNumber(xCurrencyAmount?.toFixed()),
                  )
              : xCurrencyAmount?.greaterThan(0);
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
  }, [currencyXChainIds, basedOnWallet, currency, xWallet, prices]);

  const isUserAddedToken = useIsUserAddedToken(currency as Token);
  const theme = useTheme();

  // only show add or remove buttons if not on selected list
  const [show, setShow] = useState(false);
  const open = useCallback(() => setShow(true), []);
  const close = useCallback(() => setShow(false), []);
  const price = rateFracs && new BigNumber(rateFracs[formatSymbol(currency.symbol)]?.toFixed(8));
  const hideBecauseOfLowValue = shouldHideBecauseOfLowValue(basedOnWallet, price, balance);

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

    return filterState.length > 0 ? sortedXChains.filter(xChainId => filterState.includes(xChainId)) : sortedXChains;
  }, [sortedXChains, shouldForceNetworkIcon, selectorType, bridgeDirection.from, filterState]);

  const isSingleChain = sortedXChains.length === 1 || sortedXChains.length === 0;
  const showBreakdown = basedOnWallet
    ? showCrossChainBreakdown && currencyXChainIds.length && !isSingleChain
    : (filterState.length === 0 || finalXChainIds.length > 1) && !isSingleChain;

  const shouldShowNetworkIcon =
    (basedOnWallet || shouldForceNetworkIcon) && finalXChainIds.length === 1 && !showBreakdown;

  const hideBecauseOfXChainFilter =
    filterState.length > 0 && !finalXChainIds.some(xChainId => filterState.includes(xChainId));

  const RowContentSignedIn = () => {
    return (
      <>
        <Flex alignItems={'center'}>
          {shouldShowNetworkIcon ? (
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
                {formatSymbol(currency?.symbol)}
              </DataText>
              {currency?.symbol === 'BTCB' && <DataText style={{ marginLeft: '4px' }}>{`(old)`}</DataText>}
            </Flex>

            <Typography variant="span" fontSize={14} fontWeight={400} color="text2" display="block">
              {rateFracs &&
                rateFracs[formatSymbol(currency.symbol!)] &&
                formatPrice(rateFracs[formatSymbol(currency.symbol!)].toFixed(18))}
            </Typography>
          </Flex>
        </Flex>
        <Flex justifyContent="flex-end" alignItems="center">
          <DataText variant="p" textAlign="right">
            <Typography variant="span" fontSize={16} color="text" display="block">
              {balance?.isGreaterThan(0)
                ? formatBalance(balance.toFixed(), rateFracs?.[currency.symbol!]?.toFixed(8))
                : '-'}
            </Typography>

            {balance && balance.isGreaterThan(0) && price && !price.isNaN() ? (
              <Typography variant="span" fontSize={14} color="text2" display="block">
                {formatValue(balance.times(price).toFixed())}
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
              size={'22px'}
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
            {formatSymbol(currency?.symbol)}
          </DataText>
          {currency?.symbol === 'BTCB' && <DataText style={{ marginLeft: '4px' }}>{`(old)`}</DataText>}
        </Flex>
        <Flex justifyContent="flex-end" alignItems="center">
          <DataText variant="p" textAlign="right">
            {rateFracs &&
              rateFracs[formatSymbol(currency.symbol!)] &&
              formatPrice(rateFracs[formatSymbol(currency.symbol!)].toFixed(18))}
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
    if (XChainIds.length === 1) {
      handleXChainCurrencySelect(currency, XChainIds[0]);
    } else {
      onSelect(currency);
    }
  };

  const itemContent = hasSigned ? <RowContentSignedIn /> : <RowContentNotSignedIn />;
  const itemSwapContent = hasSigned && basedOnWallet ? <RowContentSignedIn /> : <RowContentNotSignedIn />;

  if (hideBecauseOfLowValue || hideBecauseOfXChainFilter) return null;

  return (
    <>
      <ListItem
        style={{ display: 'flex', justifyContent: 'space-between', width: width ? `${width - 50}px` : 'auto' }}
        onClick={() => handleClick(currency, finalXChainIds)}
        {...(!isMobile ? { onMouseEnter: open } : null)}
        onMouseLeave={close}
        $hideBorder={!!showBreakdown}
      >
        {isSwapSelector ? itemSwapContent : itemContent}
      </ListItem>

      {showBreakdown ? (
        <Box style={{ width: width ? `${width - 50}px` : 'auto' }}>
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
                {finalXChainIds?.map(xChainId => {
                  const spokeAssetVersion: string | undefined = xTokenMap[xChainId].find(
                    xToken => xToken.symbol === currency?.symbol,
                  )?.spokeVersion;
                  return isMobile ? (
                    <Box key={xChainId} onClick={() => handleXChainCurrencySelect(currency, xChainId)}>
                      <ChainLogo chain={xChainMap[xChainId]} size="18px" />
                    </Box>
                  ) : (
                    <MouseoverTooltip
                      key={xChainId}
                      text={`${xChainMap[xChainId].name}${spokeAssetVersion ? ' (' + spokeAssetVersion + ')' : ''}`}
                      autoWidth
                      placement="bottom"
                    >
                      <Box style={{ cursor: 'pointer' }} onClick={() => handleXChainCurrencySelect(currency, xChainId)}>
                        <ChainLogo chain={xChainMap[xChainId]} size="18px" />
                      </Box>
                    </MouseoverTooltip>
                  );
                })}
              </XChainLogoList>
            )}
          </StyledBalanceBreakdown>
        </Box>
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
  filterState,
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
  filterState: XChainId[];
}) {
  const handleEscape = useKeyPress('Escape');
  const hasSignedIn = useHasSignedIn();
  const isSwapSelector = selectorType === SelectorType.SWAP_IN || selectorType === SelectorType.SWAP_OUT;

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
    return currencies;
  }, [currencies, rateFracs, sortData]);

  useEffect(() => {
    if (isOpen && handleEscape) {
      onDismiss();
    }
  }, [isOpen, handleEscape, onDismiss]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (basedOnWallet || (!isSwapSelector && hasSignedIn)) {
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

  const isWallet = isSwapSelector ? hasSignedIn && basedOnWallet : hasSignedIn;
  const secondColumnSortKey = isWallet ? 'value' : 'price';
  const content = isWallet ? <Trans>Wallet</Trans> : <Trans>Price</Trans>;

  return (
    <List1 mt={3}>
      <DashGrid style={{ width: width ? `${width - 50}px` : 'auto' }}>
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
        <StyledHeaderText
          role="button"
          className={sortBy.key === secondColumnSortKey ? sortBy.order : ''}
          onClick={() => handleSortSelect({ key: secondColumnSortKey })}
        >
          {content}
        </StyledHeaderText>
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
          filterState={filterState}
        />
      ))}
    </List1>
  );
}
