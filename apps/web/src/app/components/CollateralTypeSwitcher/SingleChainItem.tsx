import { Typography } from '@/app/theme';
import { useICX } from '@/constants/tokens';
import { useCollateralChangeIcxDisplayType, useIcxDisplayType } from '@/store/collateral/hooks';
import { useIsPositionLocked } from '@/store/loan/hooks';
import { useOraclePrices } from '@/store/oracle/hooks';
import { toFraction } from '@/utils';
import { formatSymbol, formatValue } from '@/utils/formatter';
import { xChainMap } from '@/xwagmi/constants/xChains';
import { Position, XChainId } from '@/xwagmi/types';
import { Token } from '@balancednetwork/sdk-core';
import { t } from '@lingui/macro';
import React from 'react';
import { useTheme } from 'styled-components';
import CurrencyLogoWithNetwork from '../CurrencyLogoWithNetwork';
import { AssetSymbol, BalanceAndValueWrap, DataText } from '../Wallet/styledComponents';
import { StyledListItem } from './MultiChainItem';

type SingleChainItemProps = {
  baseToken: Token;
  networkPosition: Partial<{ [key in XChainId]: Position }>;
  onSelect: (symbol: string, chainId?: XChainId) => void;
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
  const collateralChangeIcxDisplayType = useCollateralChangeIcxDisplayType();
  const icxDisplayType = useIcxDisplayType();
  const ICX = useICX();

  const price = React.useMemo(() => {
    if (!prices || (symbol && !prices[symbol])) return;
    return toFraction(prices[symbol!]);
  }, [prices, symbol]);

  const shouldShowWarning = useIsPositionLocked(collateral, loan);

  const handleItemClick = (symbol: string, chainId: XChainId, isPotential: boolean) => {
    onSelect(symbol === 'ICX' ? 'sICX' : symbol, chainId);
    if (symbol === 'sICX' || symbol === 'ICX') {
      isPotential && collateralChangeIcxDisplayType(symbol);
    }
  };

  return (
    <StyledListItem
      $border={!isNested && !isLast}
      onClick={() => handleItemClick(baseToken.symbol, xChainId as XChainId, !!isPotential)}
    >
      <AssetSymbol>
        <CurrencyLogoWithNetwork
          currency={
            isPotential
              ? baseToken
              : baseToken.symbol === 'sICX'
                ? icxDisplayType === 'ICX'
                  ? ICX
                  : baseToken
                : baseToken
          }
          chainId={xChainId as XChainId}
          bgColor={isNested ? theme.colors.bg3 : theme.colors.bg4}
          size={isNested ? '20px' : '24px'}
        />
        <Typography fontSize={isNested ? 14 : 16} fontWeight={isNested ? 'normal' : 'bold'} pl={isNested ? '5px' : 0}>
          {isNested
            ? xChainMap[xChainId].name
            : symbol === 'sICX'
              ? isPotential
                ? symbol
                : icxDisplayType
              : formatSymbol(symbol)}
        </Typography>
      </AssetSymbol>
      <BalanceAndValueWrap $warning={!isPotential && !!shouldShowWarning}>
        {collateral && collateral.greaterThan(0) && (
          <DataText
            as="div"
            $fSize={isPotential ? '12px' : '14px'}
            style={{ opacity: isPotential ? 0.75 : 1, whiteSpace: 'nowrap', alignSelf: 'center' }}
          >
            {price && formatValue(collateral?.multiply(price || 1).toFixed())}
            {isPotential && ' ' + t`available`}
          </DataText>
        )}

        {!collateral?.greaterThan(0) && <DataText as="div">-</DataText>}

        <DataText as="div">{!loan || loan.isEqualTo(0) ? '-' : formatValue(loan.toFixed())}</DataText>
      </BalanceAndValueWrap>
    </StyledListItem>
  );
};

export default SingleChainItem;
