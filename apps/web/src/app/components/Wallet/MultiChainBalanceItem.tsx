import { Currency, CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import { XChainId } from 'app/pages/trade/bridge/types';
import BigNumber from 'bignumber.js';
import React from 'react';
import { AssetSymbol, BalanceAndValueWrap, BalanceBreakdown, DataText, ListItem } from './styledComponents';
import CurrencyLogo from '../CurrencyLogo';
import { Typography } from 'app/theme';
import SingleChainBalanceItem from './SingleChainBalanceItem';
import { formatBalance, formatValue } from 'utils/formatter';
import { useRatesWithOracle } from 'queries/reward';

type MultiChainBalanceItemProps = {
  baseToken: Token;
  balances: { [key in XChainId]: CurrencyAmount<Currency> | undefined };
  total: BigNumber;
  value?: BigNumber;
};

const MultiChainBalanceItem = ({ baseToken, balances, total, value }: MultiChainBalanceItemProps) => {
  const { symbol } = baseToken;
  const arrowRef = React.useRef<HTMLElement>(null);
  const rates = useRatesWithOracle();

  const sortedEntries = React.useMemo(() => {
    return Object.entries(balances).sort(([, balanceA], [, balanceB]) => {
      if (balanceA && balanceB) {
        return balanceB.lessThan(balanceA) ? -1 : 1;
      }
      return balanceA ? -1 : 1;
    });
  }, [balances]);

  return (
    <>
      <ListItem $border={false} style={{ cursor: 'default' }}>
        <AssetSymbol>
          <CurrencyLogo currency={baseToken} />
          <Typography fontSize={16} fontWeight="bold">
            <span ref={arrowRef} style={{ display: 'inline-block' }}>
              {symbol}
            </span>
          </Typography>
        </AssetSymbol>
        <BalanceAndValueWrap>
          <DataText as="div" style={{ opacity: 0.75, fontSize: 12 }}>
            {formatBalance(total?.toFixed(), rates?.[baseToken.symbol]?.toFixed())}
          </DataText>
          <DataText as="div" style={{ opacity: 0.75, fontSize: 12 }}>
            {!value ? '-' : formatValue(value.toFixed())}
          </DataText>
        </BalanceAndValueWrap>
      </ListItem>
      <BalanceBreakdown
        $arrowPosition={arrowRef.current ? `${Math.floor(arrowRef.current.clientWidth / 2 + 23)}px` : '40px'}
      >
        {sortedEntries.map(([xChainId, balance]) => (
          <SingleChainBalanceItem
            key={xChainId}
            baseToken={baseToken}
            networkBalance={{ [xChainId]: balance }}
            value={value?.times(new BigNumber(balance?.toFixed() || 0).div(total?.isGreaterThan(0) ? total : 1))}
            isNested={true}
          />
        ))}
      </BalanceBreakdown>
    </>
  );
};

export default MultiChainBalanceItem;
