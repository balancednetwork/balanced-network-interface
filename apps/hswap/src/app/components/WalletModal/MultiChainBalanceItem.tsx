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
import CurrencyLogoWithNumber from '@/app/components2/CurrencyLogoWithNumber';
import { SubtractIcon } from '@/app/components2/Icons';

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
        <div className="py-4">
          <div className="grid grid-cols-4 items-center cursor-pointer rounded-xl px-10" onClick={() => setOpen(!open)}>
            <div className="col-span-2 font-medium flex items-center gap-2 cursor-pointer">
              <CurrencyLogoWithNumber currency={currency} amount={balances.length} />
              <div className="text-sm font-bold hover:text-title-gradient">{currency.symbol}</div>
              <span className="">{open ? <ChevronUpIcon /> : <ChevronDownIcon />}</span>
            </div>
            <div className="text-right text-sm font-bold">
              {formatBalance(total?.toFixed(), rates?.[currency.symbol]?.toFixed())}
            </div>
            <div className="text-right text-[#685682] text-sm leading-tight">
              {!value ? '-' : formatValue(value.toFixed())}
            </div>
          </div>

          <CollapsibleContent asChild>
            <div className="relative mt-4 mx-6 rounded-3xl bg-[#d4c5f9]/30">
              {balances.map(balance => (
                <SingleChainBalanceItem
                  key={balance.currency.address}
                  balance={balance}
                  isNested={true}
                  className="px-4"
                />
              ))}

              <div className="absolute top-[-16px] left-[48px]">
                <SubtractIcon className="fill-[#d4c5f9]/30" />
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </>
  );
};

export default MultiChainBalanceItem;
