import React from 'react';
import { Currency, CurrencyAmount, Fraction, Token } from '@balancednetwork/sdk-core';
import { Typography } from 'app/theme';
import { HIGH_PRICE_ASSET_DP } from 'constants/tokens';
import { Position, XChainId, XToken } from 'app/pages/trade/bridge/types';
import { useTheme } from 'styled-components';
import { xChainMap } from 'app/pages/trade/bridge/_config/xChains';
import CurrencyLogoWithNetwork from '../Wallet/CurrencyLogoWithNetwork';
import { AssetSymbol, BalanceAndValueWrap, DataText } from '../Wallet/styledComponents';
import { StyledListItem } from './MultiChainItem';
import { useRatesWithOracle } from 'queries/reward';
import { toFraction } from 'utils';
import { useCrossChainWalletBalances } from 'store/wallet/hooks';

type SingleChainItemProps = {
  baseToken: Token;
  networkPosition: Partial<{ [key in XChainId]: Position }>;
  onSelect: (symbol, chainId) => void;
  isLast?: boolean;
  isNested?: boolean;
};

const SingleChainItem = ({
  baseToken,
  networkPosition,
  onSelect,
  isLast = false,
  isNested = false,
}: SingleChainItemProps) => {
  const prices = useRatesWithOracle();
  const xWallet = useCrossChainWalletBalances();
  const [xChainId, position] = Object.entries(networkPosition)[0];
  const { collateral, loan } = position;
  const { currency } = collateral || {};
  const { symbol } = currency || {};
  const theme = useTheme();

  const price = React.useMemo(() => {
    if (!prices || (symbol && !prices[symbol])) return;
    return toFraction(prices[symbol!]);
  }, [prices, symbol]);

  const availableAmount: CurrencyAmount<Currency> | undefined = React.useMemo(() => {
    if (!price || !collateral || !currency) return;
    if (collateral.greaterThan(0)) return;
    if (!xWallet[xChainId] || !xWallet[xChainId][currency.wrapped.address]) return;
    return xWallet[xChainId][currency.wrapped.address].multiply(price);
  }, [price, collateral, xWallet, xChainId, currency]);

  return (
    <>
      <StyledListItem $border={!isNested && !isLast} onClick={() => onSelect(baseToken.symbol, xChainId)}>
        <AssetSymbol>
          <CurrencyLogoWithNetwork
            currency={baseToken}
            chainId={xChainId as XChainId}
            bgColor={isNested ? theme.colors.bg3 : theme.colors.bg4}
            size={isNested ? '20px' : '24px'}
          />
          <Typography fontSize={isNested ? 14 : 16} fontWeight={isNested ? 'normal' : 'bold'} pl={isNested ? '5px' : 0}>
            {isNested ? xChainMap[xChainId].name : symbol}
          </Typography>
        </AssetSymbol>
        <BalanceAndValueWrap>
          {collateral && collateral.greaterThan(0) && (
            <DataText as="div">
              {price && '$'}
              {collateral
                ?.multiply(price || 1)
                .toFixed(price ? 2 : HIGH_PRICE_ASSET_DP[baseToken.address] || 2, { groupSeparator: ',' })}
            </DataText>
          )}
          {availableAmount && (
            <DataText as="div">
              <Typography variant="span" fontSize={12} color="text2" display="block">
                {`$${availableAmount.toFixed(2, { groupSeparator: ',' })} available`}
              </Typography>
            </DataText>
          )}

          {!collateral?.greaterThan(0) && !availableAmount && <DataText as="div">-</DataText>}

          <DataText as="div">{!loan || loan.isEqualTo(0) ? '-' : `$${loan.toFormat(2)}`}</DataText>
        </BalanceAndValueWrap>
      </StyledListItem>
    </>
  );
};

export default SingleChainItem;
