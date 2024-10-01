import { Typography } from '@/app/theme';
import { useRatesWithOracle } from '@/queries/reward';
import { formatBalance, formatValue } from '@/utils/formatter';
import { XToken } from '@balancednetwork/sdk-core';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import React from 'react';
import CurrencyLogo from '../../components2/CurrencyLogo';
import SingleChainBalanceItem from './SingleChainBalanceItem';
import { AssetSymbol, BalanceAndValueWrap, BalanceBreakdown, DataText, ListItem } from './styledComponents';

type MultiChainBalanceItemProps = {
  balances: CurrencyAmount<XToken>[];
};

const MultiChainBalanceItem = ({ balances }: MultiChainBalanceItemProps) => {
  const currency = balances[0].currency;
  const arrowRef = React.useRef<HTMLElement>(null);
  const rates = useRatesWithOracle();

  const total = balances.reduce((acc, balance) => acc.plus(new BigNumber(balance.toFixed())), new BigNumber(0));
  const value = total.times(rates?.[currency.symbol] || '0');

  return (
    <>
      <ListItem $border={false} style={{ cursor: 'default' }}>
        <AssetSymbol>
          <CurrencyLogo currency={currency} />
          <Typography fontSize={16} fontWeight="bold">
            <span ref={arrowRef} style={{ display: 'inline-block' }}>
              {currency.symbol}
            </span>
          </Typography>
        </AssetSymbol>
        <BalanceAndValueWrap>
          <DataText as="div" style={{ opacity: 0.75, fontSize: 12 }}>
            {formatBalance(total?.toFixed(), rates?.[currency.symbol]?.toFixed())}
          </DataText>
          <DataText as="div" style={{ opacity: 0.75, fontSize: 12 }}>
            {!value ? '-' : formatValue(value.toFixed())}
          </DataText>
        </BalanceAndValueWrap>
      </ListItem>
      <BalanceBreakdown
        $arrowPosition={arrowRef.current ? `${Math.floor(arrowRef.current.clientWidth / 2 + 23)}px` : '40px'}
      >
        {balances.map(balance => (
          <SingleChainBalanceItem key={balance.currency.address} balance={balance} isNested={true} />
        ))}
      </BalanceBreakdown>
    </>
  );
};

export default MultiChainBalanceItem;
