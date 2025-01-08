import React, { useCallback } from 'react';

import { Currency, Price } from '@balancednetwork/sdk-core';

interface TradePriceProps {
  price: Price<Currency, Currency>;
  showInverted: boolean;
  setShowInverted: (showInverted: boolean) => void;
}

function TradePrice({ price, showInverted, setShowInverted }: TradePriceProps) {
  let formattedPrice: string;
  try {
    formattedPrice = showInverted ? price.toSignificant(4) : price.invert()?.toSignificant(4);
  } catch (error) {
    formattedPrice = '0';
  }

  const label = showInverted ? `${price.quoteCurrency?.symbol}` : `${price.baseCurrency?.symbol} `;
  const labelInverted = showInverted ? `${price.baseCurrency?.symbol} ` : `${price.quoteCurrency?.symbol}`;
  const flipPrice: React.MouseEventHandler<HTMLDivElement> = useCallback(
    e => {
      e.stopPropagation();
      setShowInverted(!showInverted);
    },
    [setShowInverted, showInverted],
  );

  const text = `${'1 ' + labelInverted + ' = ' + formattedPrice} ${label}`;

  return (
    <div onClick={flipPrice} title={text}>
      <div className="text-sm font-medium text-title-gradient">{text}</div>
    </div>
  );
}

export default TradePrice;
