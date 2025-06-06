import { Typography } from '@/app/theme';
import { useICX } from '@/constants/tokens';
import { useIcxDisplayType } from '@/store/collateral/hooks';
import { useOraclePrices } from '@/store/oracle/hooks';
import { toFraction } from '@/utils';
import { formatSymbol, formatValue } from '@/utils/formatter';
import { Token } from '@balancednetwork/sdk-core';
import { xChainMap } from '@balancednetwork/xwagmi';
import { Position, XChainId } from '@balancednetwork/xwagmi';
import React from 'react';
import { useTheme } from 'styled-components';
import CurrencyLogo from '../CurrencyLogo';
import CurrencyLogoWithNetwork from '../CurrencyLogoWithNetwork';
import { AssetSymbol, BalanceAndValueWrap, DataText } from '../Wallet/styledComponents';
import { StyledListItem } from './MultiChainItem';

type SingleChainItemOverviewProps = {
  baseToken: Token;
  networkPosition: Partial<{ [key in XChainId]: Position }>;
  onSelect: (symbol: string, chainId?: XChainId) => void;
  hideNetworkIcon?: boolean;
  isLast?: boolean;
  isNested?: boolean;
};

const SingleChainItemOverview = ({
  baseToken,
  networkPosition,
  onSelect,
  isLast = false,
  isNested = false,
  hideNetworkIcon = false,
}: SingleChainItemOverviewProps) => {
  const prices = useOraclePrices();
  const [xChainId, position] = Object.entries(networkPosition)[0];
  const { collateral, loan } = position;
  const { currency } = collateral || {};
  const { symbol } = currency || {};
  const theme = useTheme();
  const ICX = useICX();
  const icxDisplayType = useIcxDisplayType();

  const price = React.useMemo(() => {
    if (!prices || (symbol && !prices[symbol])) return;
    return toFraction(prices[symbol!]);
  }, [prices, symbol]);

  return (
    <>
      <StyledListItem
        $border={!isNested && !isLast}
        onClick={() => onSelect(baseToken.symbol, !hideNetworkIcon ? (xChainId as XChainId) : undefined)}
      >
        <AssetSymbol>
          {hideNetworkIcon ? (
            <CurrencyLogo
              size="24px"
              currency={baseToken.symbol === 'sICX' && icxDisplayType === 'ICX' ? ICX : baseToken}
            />
          ) : (
            <CurrencyLogoWithNetwork
              currency={baseToken.symbol === 'sICX' && icxDisplayType === 'ICX' ? ICX : baseToken}
              chainId={xChainId as XChainId}
              bgColor={isNested ? theme.colors.bg3 : theme.colors.bg4}
              size={isNested ? '20px' : '24px'}
            />
          )}

          <Typography fontSize={isNested ? 14 : 16} fontWeight={isNested ? 'normal' : 'bold'} pl={isNested ? '5px' : 0}>
            {isNested ? xChainMap[xChainId].name : symbol === 'sICX' ? icxDisplayType : formatSymbol(symbol)}
          </Typography>
        </AssetSymbol>
        <BalanceAndValueWrap>
          {collateral && collateral.greaterThan(0) ? (
            <DataText as="div">{price && formatValue(collateral?.multiply(price || 1).toFixed())}</DataText>
          ) : (
            <DataText as="div">-</DataText>
          )}

          {isNested ? (
            <DataText></DataText>
          ) : (
            <DataText>{!loan || loan.isEqualTo(0) ? '-' : formatValue(loan.toFixed())}</DataText>
          )}
        </BalanceAndValueWrap>
      </StyledListItem>
    </>
  );
};

export default SingleChainItemOverview;
