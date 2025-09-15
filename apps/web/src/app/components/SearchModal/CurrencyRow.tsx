import React, { useState, useCallback, useMemo } from 'react';

import { Currency, Fraction, Token } from '@balancednetwork/sdk-core';
import { convertCurrency, getSupportedXChainIdsForSwapToken } from '@balancednetwork/xwagmi';
import { xChainMap } from '@balancednetwork/xwagmi';
import { XChainId } from '@balancednetwork/xwagmi';
import BigNumber from 'bignumber.js';
import { isMobile } from 'react-device-detect';
import { MinusCircle } from 'react-feather';
import { Box, Flex } from 'rebass/styled-components';
import styled, { useTheme } from 'styled-components';

import CurrencyLogo from '@/app/components/CurrencyLogo';
import { DataText, ListItem } from '@/app/components/List';
import { Typography } from '@/app/theme';

import { useHasSignedIn } from '@/hooks/useWallets';
import { useRatesWithOracle } from '@/queries/reward';
import { useIsUserAddedToken } from '@/store/user/hooks';
import { useCrossChainWalletBalances, useXCurrencyBalance } from '@/store/wallet/hooks';
import { formatBalance, formatPrice, formatSymbol, formatValue } from '@/utils/formatter';
import { ChainLogo } from '../ChainLogo';
import CurrencyLogoWithNetwork from '../CurrencyLogoWithNetwork';
import { MouseoverTooltip } from '../Tooltip';
import { BalanceBreakdown } from '../Wallet/styledComponents';
import { CurrencySelectionType } from './CurrencySearch';
import CurrencyXChainItem from './CurrencyXChainItem';
import { XChainLogoList } from './styleds';
import { shouldHideBecauseOfLowValue } from './utils';

const StyledBalanceBreakdown = styled(BalanceBreakdown)`
  margin-top: 18px;
  grid-column: span 2;
  color: ${({ theme }) => theme.colors.text2};
`;

export default function CurrencyRow({
  currency,
  onSelect,
  onRemove,
  rateFracs,
  selectedChainId,
  basedOnWallet,
  currencySelectionType,
  width,
  filterState,
}: {
  currency: Currency;
  filterState: XChainId[];
  onSelect: (currency: Currency, setDefaultChain?: boolean) => void;
  onRemove: () => void;
  rateFracs: { [key in string]: Fraction } | undefined;
  selectedChainId: XChainId | undefined;
  basedOnWallet: boolean;
  currencySelectionType: CurrencySelectionType;
  width?: number;
}) {
  const currencyXChainIds = useMemo(() => getSupportedXChainIdsForSwapToken(currency), [currency]);
  const balance = useXCurrencyBalance(currency, selectedChainId);
  const hasSigned = useHasSignedIn();
  const xWallet = useCrossChainWalletBalances();
  const isSwapSelector =
    currencySelectionType === CurrencySelectionType.TRADE_IN ||
    currencySelectionType === CurrencySelectionType.TRADE_OUT;
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

  const finalXChainIds = useMemo(() => {
    if (
      currencySelectionType === CurrencySelectionType.TRADE_MINT_QUOTE ||
      currencySelectionType === CurrencySelectionType.BRIDGE
    ) {
      return [selectedChainId!];
    }

    return filterState.length > 0 ? sortedXChains.filter(xChainId => filterState.includes(xChainId)) : sortedXChains;
  }, [sortedXChains, currencySelectionType, filterState, selectedChainId]);

  const showBreakdown = finalXChainIds.length > 1;

  const hideBecauseOfXChainFilter =
    filterState.length > 0 && !finalXChainIds.some(xChainId => filterState.includes(xChainId));

  const RowContentSignedIn = () => {
    return (
      <>
        <Flex alignItems={'center'}>
          {finalXChainIds.length === 1 ? (
            <CurrencyLogoWithNetwork
              currency={currency}
              bgColor={theme.colors.bg4}
              chainId={finalXChainIds[0]}
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
          {finalXChainIds.length === 1 ? (
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

  const handleClick = () => {
    if (finalXChainIds.length === 1) {
      onSelect(convertCurrency(finalXChainIds[0], currency)!, false);
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
        onClick={handleClick}
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
              finalXChainIds.map(xChainId => {
                const _c = convertCurrency(xChainId, currency)!;
                return (
                  <CurrencyXChainItem
                    key={`${currency.symbol}-${xChainId}`}
                    price={rateFracs && rateFracs[currency.symbol!]}
                    balance={xWallet[_c.xChainId]?.[_c?.address]}
                    onSelect={() => onSelect(_c, false)}
                  />
                );
              })
            ) : (
              <XChainLogoList>
                {finalXChainIds?.map(xChainId => {
                  const _c = convertCurrency(xChainId, currency)!;
                  const spokeAssetVersion = _c?.spokeVersion;
                  return isMobile ? (
                    <Box key={xChainId} onClick={() => onSelect(_c, false)}>
                      <ChainLogo chain={xChainMap[xChainId]} size="18px" />
                    </Box>
                  ) : (
                    <MouseoverTooltip
                      key={xChainId}
                      text={`${xChainMap[xChainId].name}${spokeAssetVersion ? ' (' + spokeAssetVersion + ')' : ''}`}
                      autoWidth
                      placement="bottom"
                    >
                      <Box style={{ cursor: 'pointer' }} onClick={() => onSelect(_c, false)}>
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
