import { Token } from '@balancednetwork/sdk-core';
import { Position, XChainId } from '@/app/pages/trade/bridge/types';
import React from 'react';
import CurrencyLogo from '../CurrencyLogo';
import { Typography } from '@/app/theme';
import SingleChainItem from './SingleChainItem';
import { AssetSymbol, BalanceAndValueWrap, BalanceBreakdown, ListItem } from '../Wallet/styledComponents';
import styled from 'styled-components';

type MultiChainItemProps = {
  baseToken: Token;
  positions: Partial<{ [key in XChainId]: Position }>;
  onSelect: (symbol, chainId?) => void;
};

export const StyledListItem = styled(ListItem)`
  transition: color ease 0.3s;
  align-items: baseline;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primaryBright};
  }
`;

const MultiChainItem = ({ baseToken, positions, onSelect }: MultiChainItemProps) => {
  const { symbol } = baseToken;
  const arrowRef = React.useRef<HTMLElement>(null);

  const sortedEntries = React.useMemo(() => {
    return Object.entries(positions).sort(([, positionA], [, positionB]) => {
      if (positionA.collateral && positionB.collateral) {
        return positionB.collateral.lessThan(positionA.collateral) ? -1 : 1;
      }
      return positionA ? -1 : 1;
    });
  }, [positions]);

  return (
    <>
      <StyledListItem $border={false} onClick={() => onSelect(baseToken.symbol)}>
        <AssetSymbol>
          <CurrencyLogo currency={baseToken} />
          <Typography fontSize={16} fontWeight="bold">
            <span ref={arrowRef} style={{ display: 'inline-block' }}>
              {symbol}
            </span>
          </Typography>
        </AssetSymbol>
        <BalanceAndValueWrap />
      </StyledListItem>
      <BalanceBreakdown
        $arrowPosition={arrowRef.current ? `${Math.floor(arrowRef.current.clientWidth / 2 + 23)}px` : '40px'}
      >
        {sortedEntries.map(([xChainId, position]) => (
          <SingleChainItem
            key={xChainId}
            baseToken={baseToken}
            networkPosition={{ [xChainId]: position }}
            onSelect={onSelect}
            isNested={true}
          />
        ))}
      </BalanceBreakdown>
    </>
  );
};

export default MultiChainItem;
