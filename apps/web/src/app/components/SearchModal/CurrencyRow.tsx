// @ts-nocheck
import React, { useState, useCallback, useMemo } from 'react';

import { Currency, Fraction, Token } from '@balancednetwork/sdk-core';
import { ICON_XCALL_NETWORK_ID } from '@balancednetwork/xwagmi';
import { xChainMap } from '@balancednetwork/xwagmi';
import { xTokenMap } from '@balancednetwork/xwagmi';
import { XChainId } from '@balancednetwork/xwagmi';
import { getSupportedXChainIdsForToken } from '@balancednetwork/xwagmi';
import BigNumber from 'bignumber.js';
import { isMobile } from 'react-device-detect';
import { MinusCircle } from 'react-feather';
import { Box, Flex } from 'rebass/styled-components';
import styled, { useTheme } from 'styled-components';

import CurrencyLogo from '@/app/components/CurrencyLogo';
import { DataText, ListItem } from '@/app/components/List';
import { Typography } from '@/app/theme';

import { useHasSignedIn } from '@/hooks/useWallets';
import { useBridgeDirection } from '@/store/bridge/hooks';
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

const StyledBalanceBreakdown = styled(BalanceBreakdown)`
  margin-top: 18px;
  grid-column: span 2;
  color: ${({ theme }) => theme.colors.text2};
`;

export default function CurrencyRow({
  currency,
  onSelect,
  onChainSelect,
  onRemove,
  rateFracs,
  selectedChainId,
  showCrossChainBreakdown,
  basedOnWallet,
  width,
  currencySelectionType,
}: {
  currency: Currency;
  showCrossChainBreakdown: boolean;
  onSelect: (currency: Currency, setDefaultChain?: boolean) => void;
  onChainSelect?: (chainId: XChainId) => void;
  onRemove: () => void;
  rateFracs: { [key in string]: Fraction } | undefined;
  selectedChainId: XChainId | undefined;
  basedOnWallet: boolean;
  width?: number;
  currencySelectionType: CurrencySelectionType;
}) {
  const currencyXChainIds = useMemo(() => getSupportedXChainIdsForToken(currency), [currency]);
  const balance = useXCurrencyBalance(currency, selectedChainId);
  const hasSigned = useHasSignedIn();
  const xWallet = useCrossChainWalletBalances();
  const isSwapSelector =
    currencySelectionType === CurrencySelectionType.TRADE_IN ||
    currencySelectionType === CurrencySelectionType.TRADE_OUT;

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
  const price = rateFracs && new BigNumber(rateFracs[formatSymbol(currency.symbol)]?.toFixed(8));
  const hideBecauseOfLowValue =
    basedOnWallet &&
    (price && !price.isNaN() ? basedOnWallet && balance?.times(price).isLessThan(0.01) : balance?.isLessThan(0.01));
  const shouldForceNetworkIcon =
    currencySelectionType === CurrencySelectionType.TRADE_MINT_QUOTE ||
    currencySelectionType === CurrencySelectionType.BRIDGE;

  const bridgeDirection = useBridgeDirection();
  const finalXChainIds = useMemo(() => {
    if (currencySelectionType === CurrencySelectionType.BRIDGE) {
      return [bridgeDirection.from];
    }

    if (currencySelectionType === CurrencySelectionType.TRADE_MINT_QUOTE) {
      return [selectedChainId];
    }

    return sortedXChains;
  }, [sortedXChains, currencySelectionType, bridgeDirection.from, selectedChainId]);

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
    if (basedOnWallet && XChainIds.length === 1) {
      handleXChainCurrencySelect(currency, XChainIds[0]);
    } else {
      onSelect(currency);
    }
  };

  const itemContent = hasSigned ? <RowContentSignedIn /> : <RowContentNotSignedIn />;
  const itemSwapContent = hasSigned && basedOnWallet ? <RowContentSignedIn /> : <RowContentNotSignedIn />;

  if (hideBecauseOfLowValue) return null;

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
                <CurrencyXChainItem
                  key={`${currency.symbol}-${xChainId}`}
                  xChainId={xChainId}
                  currency={currency}
                  price={rateFracs && rateFracs[currency.symbol!] ? rateFracs[currency.symbol!].toFixed(18) : '0'}
                  onSelect={handleXChainCurrencySelect}
                />
              ))
            ) : (
              <XChainLogoList>
                {sortedXChains?.map(xChainId => {
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
