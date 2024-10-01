import CurrencyLogoWithNetwork from '@/app/components2/CurrencyLogoWithNetwork';
import { Card } from '@/components/ui/card';
import useAmountInUSD from '@/hooks/useAmountInUSD';
import { Field } from '@/store/swap/reducer';
import { formatBigNumber } from '@/utils';
import { Currency, CurrencyAmount, XToken } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import React from 'react';

interface CurrencyCardProps {
  currency: XToken | undefined;
  currencyAmount: CurrencyAmount<Currency> | undefined;
}

const CurrencyCard: React.FC<CurrencyCardProps> = ({ currency, currencyAmount }) => {
  const amountInUSD = useAmountInUSD(currencyAmount);

  return (
    <Card className="flex flex-col items-center gap-4 p-8 border-none w-1/2">
      <div>{currency && <CurrencyLogoWithNetwork currency={currency} size="24px" />}</div>
      <div className="text-primary-foreground">
        {formatBigNumber(new BigNumber(currencyAmount?.toFixed() || 0), 'currency')} {currency?.symbol}
      </div>
      <div className="text-secondary-foreground">{amountInUSD}</div>
    </Card>
  );
};

export default CurrencyCard;
