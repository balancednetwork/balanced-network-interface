import CurrencyLogo from '@/app/components2/CurrencyLogo';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useRatesWithOracle } from '@/queries/reward';
import { formatBalance, formatValue } from '@/utils/formatter';
import { XToken } from '@balancednetwork/sdk-core';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import React, { useState } from 'react';
import SingleChainBalanceItem from './SingleChainBalanceItem';

type MultiChainBalanceItemProps = {
  balances: CurrencyAmount<XToken>[];
};

const MultiChainBalanceItem = ({ balances }: MultiChainBalanceItemProps) => {
  const [open, setOpen] = useState(false);

  const currency = balances[0].currency;
  const rates = useRatesWithOracle();

  const total = balances.reduce((acc, balance) => acc.plus(new BigNumber(balance.toFixed())), new BigNumber(0));
  const value = total.times(rates?.[currency.symbol] || '0');

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen} asChild>
        <div>
          <div
            className="grid grid-cols-3 h-10 items-center hover:bg-accent cursor-pointer rounded-xl px-2"
            onClick={() => setOpen(!open)}
          >
            <div className="font-medium h-10 flex items-center gap-2 cursor-pointer">
              <CurrencyLogo currency={currency} />
              <div>{currency.symbol}</div>
              <span>{open ? <ChevronUpIcon /> : <ChevronDownIcon />}</span>
            </div>
            <div className="text-right">{formatBalance(total?.toFixed(), rates?.[currency.symbol]?.toFixed())}</div>
            <div className="text-right">{!value ? '-' : formatValue(value.toFixed())}</div>
          </div>

          <CollapsibleContent asChild>
            <div className="relative bg-[#221542] p-0 rounded-xl">
              {balances.map(balance => (
                <SingleChainBalanceItem key={balance.currency.address} balance={balance} isNested={true} />
              ))}
              <div className="absolute left-[48px] transform -translate-x-1/2 top-[-10px] w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-[#221542]"></div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </>
  );
};

export default MultiChainBalanceItem;
