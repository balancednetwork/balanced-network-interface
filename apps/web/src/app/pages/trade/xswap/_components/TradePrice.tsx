import React, { useCallback, memo } from 'react';

import { Currency, Price } from '@balancednetwork/sdk-core';
import { Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Typography } from '@/app/theme';
import { formatSymbol } from '@/utils/formatter';

interface TradePriceProps {
  price: Price<Currency, Currency>;
  showInverted: boolean;
  setShowInverted: (showInverted: boolean) => void;
}

const StyledPriceContainer = styled(Box)`
  display: flex;
  justify-content: center;
  align-items: center;
  user-select: none;
  padding: 0;
  border: none;
  cursor: pointer;
`;

function TradePrice({ price, showInverted, setShowInverted }: TradePriceProps) {
  let formattedPrice: string;
  try {
    formattedPrice = showInverted ? price.toSignificant(4) : price.invert()?.toSignificant(4);
  } catch (error) {
    formattedPrice = '0';
  }

  const label = showInverted
    ? `${formatSymbol(price.quoteCurrency?.symbol)}`
    : `${formatSymbol(price.baseCurrency?.symbol)}`;
  const labelInverted = showInverted ? `${price.baseCurrency?.symbol} ` : `${price.quoteCurrency?.symbol}`;
  const flipPrice = useCallback(() => setShowInverted(!showInverted), [setShowInverted, showInverted]);

  const text = `1 ${labelInverted} = ${formattedPrice ?? '-'} ${label}`;

  return (
    <StyledPriceContainer onClick={flipPrice} title={text}>
      <div style={{ alignItems: 'center', display: 'flex', width: 'fit-content' }}>
        <Typography textAlign="right">{text}</Typography>
      </div>
    </StyledPriceContainer>
  );
}

export default memo(TradePrice);
