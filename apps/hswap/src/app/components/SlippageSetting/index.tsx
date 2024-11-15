import React from 'react';

import { Input } from '@/components/ui/input';
import { escapeRegExp } from '@/utils';

// enum SlippageError {
//   InvalidInput = 'InvalidInput',
//   RiskyLow = 'RiskyLow',
//   RiskyHigh = 'RiskyHigh',
// }

export interface SlippageSettingsProps {
  rawSlippage: number;
  setRawSlippage: (rawSlippage: number) => void;
}
const inputRegex = /^\d*(?:\\[.])?\d*$/;
export default function SlippageSettings({ rawSlippage, setRawSlippage }: SlippageSettingsProps) {
  const [slippageInput, setSlippageInput] = React.useState('');
  // const [deadlineInput, setDeadlineInput] = React.useState('');

  const slippageInputIsValid =
    slippageInput === '' || (rawSlippage / 100).toFixed(2) === Number.parseFloat(slippageInput).toFixed(2);
  // const deadlineInputIsValid = deadlineInput === '' || (deadline / 60).toString() === deadlineInput;

  // let slippageError: SlippageError | undefined;
  // if (slippageInput !== '' && !slippageInputIsValid) {
  //   slippageError = SlippageError.InvalidInput;
  // } else if (slippageInputIsValid && rawSlippage < 50) {
  //   slippageError = SlippageError.RiskyLow;
  // } else if (slippageInputIsValid && rawSlippage > 500) {
  //   slippageError = SlippageError.RiskyHigh;
  // } else {
  //   slippageError = undefined;
  // }
  const handleSlippageInput = (value: string) => {
    if (value === '' || inputRegex.test(escapeRegExp(value))) {
      parseCustomSlippage(value);
    }
  };

  function parseCustomSlippage(value: string) {
    setSlippageInput(value);

    try {
      const valueAsIntFromRoundedFloat = Number.parseInt((Number.parseFloat(value) * 100).toString());
      if (!Number.isNaN(valueAsIntFromRoundedFloat) && valueAsIntFromRoundedFloat <= 1000) {
        setRawSlippage(valueAsIntFromRoundedFloat);
      }
    } catch {}
  }

  return (
    <div className="flex flex-col justify-end">
      <div className="p-0 flex items-center gap-1 text-sm font-bold text-white">
        <Input
          placeholder={(rawSlippage / 100).toFixed(2)}
          value={slippageInput}
          onBlur={() => {
            parseCustomSlippage((rawSlippage / 100).toFixed(2));
          }}
          onChange={e => {
            handleSlippageInput(e.target.value.replace(/,/g, '.'));
          }}
          className="p-0 w-[72px] h-6 text-right bg-transparent border-none focus:border-none text-primary-foreground focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <span>%</span>
      </div>
      {!slippageInputIsValid ? (
        <div>
          <div className="text-[#f3841e] hidden">
            <div className="text-right text-['#fb6a6a']">10% max</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
