import { Typography } from '@/app/theme';
import { formatSymbol } from '@/utils/formatter';
import { Token } from '@balancednetwork/sdk-core';
import { Position, XChainId } from '@balancednetwork/xwagmi';
import React from 'react';
import styled from 'styled-components';
import CurrencyLogo from '../CurrencyLogo';
import { AssetSymbol, BalanceAndValueWrap, BalanceBreakdown, ListItem } from '../Wallet/styledComponents';
import SingleChainItem from './SingleChainItem';

type MultiChainItemProps = {
  baseToken: Token;
  positions: Partial<{ [key in XChainId]: Position }>;
  onSelect: (symbol: string, chainId?: XChainId) => void;
};

export const StyledListItem = styled(ListItem)`
  transition: color ease 0.3s;
  align-items: center;
  
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
        if (positionA.isPotential && positionB.isPotential) {
          return positionA.collateral.greaterThan(positionB.collateral) ? 1 : -1;
        } else if (positionA.isPotential && !positionB.isPotential) {
          return 1;
        } else if (!positionA.isPotential && positionB.isPotential) {
          return -1;
        } else {
          return positionA.collateral.greaterThan(positionB.collateral) ? -1 : 1;
        }
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
              {formatSymbol(symbol)}
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
