import React from 'react';
import { Token } from '@balancednetwork/sdk-core';
import { Typography } from 'app/theme';
import { HIGH_PRICE_ASSET_DP } from 'constants/tokens';
import { Position, XChainId } from 'app/pages/trade/bridge/types';
import { useTheme } from 'styled-components';
import { xChainMap } from 'app/pages/trade/bridge/_config/xChains';
import CurrencyLogoWithNetwork from '../Wallet/CurrencyLogoWithNetwork';
import { AssetSymbol, BalanceAndValueWrap, DataText, ListItem } from '../Wallet/styledComponents';

type SingleChainItemProps = {
  baseToken: Token;
  networkPosition: Partial<{ [key in XChainId]: Position }>;
  onSelect: (symbol) => void;
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
  const [xChainId, position] = Object.entries(networkPosition)[0];
  const { collateral, loan } = position;
  const { currency } = collateral || {};
  const { symbol } = currency || {};
  const theme = useTheme();

  return (
    <>
      <ListItem $border={!isNested && !isLast} onClick={() => onSelect(baseToken.symbol)}>
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
          <DataText as="div">
            {collateral?.toFixed(HIGH_PRICE_ASSET_DP[baseToken.address] || 2, { groupSeparator: ',' })}
          </DataText>
          <DataText as="div">{!loan ? '-' : `$${loan.toFormat(2)}`}</DataText>
        </BalanceAndValueWrap>
      </ListItem>
    </>
  );
};

export default SingleChainItem;
