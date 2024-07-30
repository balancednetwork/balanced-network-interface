import React from 'react';
import { Token } from '@balancednetwork/sdk-core';
import { Typography } from 'app/theme';
import { HIGH_PRICE_ASSET_DP } from 'constants/tokens';
import { Position, XChainId, XToken } from 'app/pages/trade/bridge/types';
import { useTheme } from 'styled-components';
import { xChainMap } from 'app/pages/trade/bridge/_config/xChains';
import { AssetSymbol, BalanceAndValueWrap, DataText } from '../Wallet/styledComponents';
import { StyledListItem } from './MultiChainItem';
import { toFraction } from 'utils';
import { useOraclePrices } from 'store/oracle/hooks';
import { t } from '@lingui/macro';
import CurrencyLogoWithNetwork from '../CurrencyLogoWithNetwork';

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
  const prices = useOraclePrices();
  const [xChainId, position] = Object.entries(networkPosition)[0];
  const { collateral, loan, isPotential } = position;
  const { currency } = collateral || {};
  const { symbol } = currency || {};
  const theme = useTheme();

  const price = React.useMemo(() => {
    if (!prices || (symbol && !prices[symbol])) return;
    return toFraction(prices[symbol!]);
  }, [prices, symbol]);

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
            <DataText as="div" $fSize={isPotential ? '12px' : '14px'} style={{ opacity: isPotential ? 0.75 : 1 }}>
              {price && '$'}
              {collateral
                ?.multiply(price || 1)
                .toFixed(price ? 0 : HIGH_PRICE_ASSET_DP[baseToken.address] || 2, { groupSeparator: ',' })}
              {isPotential && ' ' + t`available`}
            </DataText>
          )}

          {!collateral?.greaterThan(0) && <DataText as="div">-</DataText>}

          <DataText as="div">{!loan || loan.isEqualTo(0) ? '-' : `$${loan.toFormat(0)}`}</DataText>
        </BalanceAndValueWrap>
      </StyledListItem>
    </>
  );
};

export default SingleChainItem;
