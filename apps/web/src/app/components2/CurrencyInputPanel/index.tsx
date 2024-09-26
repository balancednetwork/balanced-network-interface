import React, { useCallback, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { escapeRegExp } from '@/utils';
import { XToken } from '@balancednetwork/sdk-core';
import CurrencyLogoWithNetwork from '../CurrencyLogoWithNetwork';
import { TokenSelectModal } from '../TokenSelectModal';

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
}

export const inputRegex = /^\d*(?:\\[.])?\d*$/; // match escaped "." characters via in a non-capturing group

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

  return (
    <div className="rounded-xl w-full bg-card p-4 flex flex-col gap-2">
      <span className="text-secondary-foreground text-subtitle">You pay</span>
      <div className="inline-flex w-full">
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
          className="p-0 text-title text-xl bg-transparent border-none focus:border-none text-primary-foreground focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />

        <div>
          <Button onClick={toggleOpen} disabled={!onCurrencySelect} className="bg-background">
            {currency ? (
              <div className="flex gap-2">
                <CurrencyLogoWithNetwork currency={currency} size="24px" />
                <div className="token-symbol-container">{currency.symbol}</div>
                {/* {currency.symbol === 'BTCB' && <div style={{ marginLeft: 5, marginRight: 5 }}>(old)</div>} */}
              </div>
            ) : (
              <div>Choose a token</div>
            )}
          </Button>
          {onCurrencySelect && (
            <TokenSelectModal
              open={open}
              setOpen={setOpen}
              account={account}
              onCurrencySelect={onCurrencySelect}
              selectedCurrency={currency}
            />
          )}
        </div>
      </div>
      <div className="flex justify-between">
        <span className="text-secondary-foreground text-smallbody">$2,000</span>
        <span className="text-secondary-foreground text-smallbody">2,000 USDC</span>
      </div>
    </div>
  );
}
