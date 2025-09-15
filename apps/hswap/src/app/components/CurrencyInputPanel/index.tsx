import React, { useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useAmountInUSD from '@/hooks/useAmountInUSD';
import { cn } from '@/lib/utils';
import { escapeRegExp, toFraction } from '@/utils';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { XToken } from '@balancednetwork/xwagmi';
import BigNumber from 'bignumber.js';
import { ChevronDownIcon } from 'lucide-react';
import CurrencyLogoWithNetwork from '../CurrencyLogoWithNetwork';
import { TokenSelectModal } from '../TokenSelectModal';

export enum CurrencyInputPanelType {
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT',
}

interface CurrencyInputPanelProps {
  label?: string;
  value: string;
  onUserInput: (value: string) => void;
  onCurrencySelect?: (currency: XToken) => void;
  currency?: XToken | null;
  onPercentSelect?: (percent: number) => void;
  percent?: number;
  placeholder?: string;
  className?: string;
  account?: string | null;
  balance?: CurrencyAmount<XToken> | undefined;
  type: CurrencyInputPanelType;
  showWarning?: boolean;
}

const inputRegex = /^\d*(?:\\[.])?\d*$/; // match escaped "." characters via in a non-capturing group

export default function CurrencyInputPanel({
  value,
  onUserInput,
  onCurrencySelect,
  currency,
  onPercentSelect,
  percent,
  placeholder = '0',
  className,
  account,
  balance,
  type,
  showWarning,
}: CurrencyInputPanelProps) {
  const [open, setOpen] = React.useState(false);
  const [isActive, setIsActive] = React.useState(false);
  const toggleOpen = () => {
    setOpen(!open);
  };

  const enforcer = (nextUserInput: string) => {
    if (nextUserInput === '' || inputRegex.test(escapeRegExp(nextUserInput))) {
      onUserInput(nextUserInput);
    }
  };
  const currencyAmount = useMemo(() => {
    if (!currency || !value) {
      return undefined;
    }

    return CurrencyAmount.fromRawAmount(
      currency,
      new BigNumber(value).times((10n ** BigInt(currency.decimals)).toString()).toFixed(0),
    );
  }, [currency, value]);
  const valueInUSD = useAmountInUSD(currencyAmount);

  return (
    <div className={cn('rounded-xl w-full flex flex-col gap-1 items-center')}>
      <div className="flex flex-col justify-center items-center gap-1">
        <Input
          placeholder={placeholder}
          value={value}
          onClick={() => setIsActive(!isActive)}
          onBlur={() => setIsActive(false)}
          onChange={event => {
            enforcer(event.target.value.replace(/,/g, '.'));
          }}
          // universal input options
          inputMode="decimal"
          title="Token Amount"
          autoComplete="off"
          autoCorrect="off"
          // text-specific options
          type="text"
          pattern="^[0-9]*[.,]?[0-9]*$"
          minLength={1}
          maxLength={79}
          spellCheck="false"
          className={cn(
            'p-0 text-center text-4xl font-extrabold leading-10 text-title-gradient bg-transparent border-none focus:border-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0',
            showWarning && 'text-warning',
          )}
        />
        <div>
          <Button
            onClick={toggleOpen}
            disabled={!onCurrencySelect}
            className="h-12 pl-1 pr-4 py-1 bg-transparent hover:bg-transparent rounded-full border-4 border-[#685682]/30"
          >
            {currency ? (
              <div className="flex gap-2 items-center justify-between">
                <CurrencyLogoWithNetwork
                  currency={currency}
                  className="p-[2.5px] h-8 w-8"
                  chainLogoClassName="p-[1.5px]"
                />
                <div className="token-symbol-container text-[#E6E0F7] text-sm font-bold">{currency.symbol}</div>
                <ChevronDownIcon />
              </div>
            ) : (
              <div>Choose a token</div>
            )}
          </Button>
          {onCurrencySelect && (
            <TokenSelectModal
              key={type}
              open={open}
              onDismiss={() => {
                setOpen(false);
              }}
              account={account}
              onCurrencySelect={onCurrencySelect}
              selectedCurrency={currency}
            />
          )}
        </div>
      </div>
      <div className="flex flex-col justify-between items-center gap-4">
        <span className="text-[#d4c5f9] text-[12px] font-semibold uppercase cursor-default min-h-[18px]">
          {valueInUSD}
        </span>
        <div className="flex gap-2 items-center">
          {type === CurrencyInputPanelType.INPUT && (
            <>
              <span className="text-[#685682] text-[12px] font-medium leading-3 cursor-default">
                {`${balance ? balance.toFixed(4, { groupSeparator: ',' }) : 0} ${currency?.symbol}`}
              </span>
              <span
                className="px-2 py-0.5 bg-[#685682] rounded-full cursor-pointer text-[#0d0229] text-[12px] font-medium leading-3 uppercase"
                onClick={() => onPercentSelect?.(100)}
              >
                Max
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
