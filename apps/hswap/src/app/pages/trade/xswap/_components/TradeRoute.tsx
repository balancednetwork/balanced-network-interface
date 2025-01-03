import CurrencyLogoWithNetwork from '@/app/components/CurrencyLogoWithNetwork';
import { Field } from '@/store/swap/reducer';
import { Currency, Token } from '@balancednetwork/sdk-core';
import { Route } from '@balancednetwork/v1-sdk';
import { XToken } from '@balancednetwork/xwagmi';
import React from 'react';

function TradeRoute({
  route,
  currencies,
}: {
  route: Route<Currency, Currency>;
  currencies: { [field in Field]?: XToken };
}) {
  return (
    <div className="flex gap-2">
      {currencies[Field.INPUT] && currencies[Field.INPUT].xChainId !== '0x1.icon' && (
        <CurrencyLogoWithNetwork currency={currencies[Field.INPUT]} />
      )}
      {route.path.map((token: Token, index: number) => {
        const xtoken = XToken.getXToken('0x1.icon', token);
        return <CurrencyLogoWithNetwork key={xtoken.address} currency={xtoken} />;
      })}
      {currencies[Field.OUTPUT] && currencies[Field.OUTPUT].xChainId !== '0x1.icon' && (
        <CurrencyLogoWithNetwork currency={currencies[Field.OUTPUT]} />
      )}
    </div>
  );
}

export default TradeRoute;
