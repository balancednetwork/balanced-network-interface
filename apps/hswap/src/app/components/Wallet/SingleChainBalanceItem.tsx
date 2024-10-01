import { Typography } from '@/app/theme';
import { useRatesWithOracle } from '@/queries/reward';
import { formatBalance, formatValue } from '@/utils/formatter';
import { xChainMap } from '@/xwagmi/constants/xChains';
import { XToken } from '@balancednetwork/sdk-core';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import React from 'react';
import CurrencyLogoWithNetwork from '../../components2/CurrencyLogoWithNetwork';
import { AssetSymbol, BalanceAndValueWrap, DataText, ListItem } from './styledComponents';

type SingleChainBalanceItemProps = {
  balance: CurrencyAmount<XToken>;
  isLast?: boolean;
  isNested?: boolean;
};

const SingleChainBalanceItem = ({ balance, isLast = false, isNested = false }: SingleChainBalanceItemProps) => {
  const currency = balance.currency;
  const rates = useRatesWithOracle();
  const value = new BigNumber(balance.toFixed()).times(rates?.[currency.symbol] || 0);
  return (
    <ListItem $border={!isNested && !isLast}>
      <AssetSymbol>
        <CurrencyLogoWithNetwork currency={currency} size={isNested ? '20px' : '24px'} />
        <Typography fontSize={isNested ? 14 : 16} fontWeight={isNested ? 'normal' : 'bold'} pl={isNested ? '5px' : 0}>
          {isNested ? xChainMap[currency.xChainId].name : currency.symbol}
        </Typography>
      </AssetSymbol>
      <BalanceAndValueWrap>
        <DataText as="div">{formatBalance(balance?.toFixed(), rates?.[currency.symbol]?.toFixed())}</DataText>
        <DataText as="div">{!value ? '-' : formatValue(value.toFixed())}</DataText>
      </BalanceAndValueWrap>
    </ListItem>
  );
};

export default SingleChainBalanceItem;
