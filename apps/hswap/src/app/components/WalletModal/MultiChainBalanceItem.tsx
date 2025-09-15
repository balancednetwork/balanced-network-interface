import CurrencyLogoWithNumber from '@/app/components/CurrencyLogoWithNumber';
import { ChevronDownIcon, ChevronUpIcon, SubtractIcon } from '@/app/components/Icons';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { useRatesWithOracle } from '@/queries/reward';
import { formatBalance, formatValue } from '@/utils/formatter';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { XToken } from '@balancednetwork/xwagmi';
import BigNumber from 'bignumber.js';
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
          <div className="grid grid-cols-4 items-center cursor-pointer rounded-xl px-10" onClick={() => setOpen(!open)}>
            <div className="col-span-2 font-medium flex items-center gap-2 cursor-pointer">
              <CurrencyLogoWithNumber currency={currency} amount={balances.length} />
              <div className="text-[#0d0229] text-sm font-bold hover:text-title-gradient leading-tight">
                {currency.symbol}
              </div>
              <span className="">{open ? <ChevronUpIcon /> : <ChevronDownIcon />}</span>
            </div>
            <div className="text-right text-[#0d0229] text-sm font-bold leading-tight">
              {formatBalance(total?.toFixed(), rates?.[currency.symbol]?.toFixed())}
            </div>
            <div className="text-right text-[#685682] text-sm font-medium leading-tight">
              {!value ? '-' : formatValue(value.toFixed())}
            </div>
          </div>

          <CollapsibleContent asChild>
            <div className="relative mt-4 mx-6 rounded-3xl bg-[#ffffff4a] flex flex-col gap-4 py-4">
              {balances.map(balance => (
                <SingleChainBalanceItem
                  key={balance.currency.address}
                  balance={balance}
                  isNested={true}
                  className="px-4"
                />
              ))}

              <div className="absolute top-[-16px] left-[48px]">
                <SubtractIcon className="fill-[#ffffff4a]" />
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </>
  );
};

export default MultiChainBalanceItem;
