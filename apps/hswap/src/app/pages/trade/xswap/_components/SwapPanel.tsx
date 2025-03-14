import React, { useCallback, useMemo } from 'react';

import { XToken } from '@balancednetwork/xwagmi';
import { XTransactionType } from '@balancednetwork/xwagmi';

import CurrencyInputPanel, { CurrencyInputPanelType } from '@/app/components/CurrencyInputPanel';
import { SwitchGradientIcon } from '@/app/components/Icons';
import { useSignedInWallets } from '@/hooks/useWallets';
import {
  useDerivedMMTradeInfo,
  useDerivedSwapInfo,
  useInitialSwapLoad,
  useSwapActionHandlers,
  useSwapState,
} from '@/store/swap/hooks';
import { Field } from '@/store/swap/reducer';
import { maxAmountSpend } from '@/utils';
import { Percent } from '@balancednetwork/sdk-core';
import AdvancedSwapDetails from './AdvancedSwapDetails';
import BridgeLimitWarning from './BridgeLimitWarning';
import MMAdvancedSwapDetails from './MMAdvancedSwapDetails';
import MMSwapCommitButton from './MMSwapCommitButton';
import RecipientAddressPanel from './RecipientAddressPanel';
import SwapCommitButton from './SwapCommitButton';

export default function SwapPanel() {
  useInitialSwapLoad();

  const {
    currencyBalances,
    currencies,
    accounts,
    formattedAmounts,
    maximumBridgeAmount,
    canBridge,
    xTransactionType,
    direction,
    trade,
    inputError,
  } = useDerivedSwapInfo();
  const mmTrade = useDerivedMMTradeInfo(trade);

  const account = accounts[Field.INPUT];
  const { recipient } = useSwapState();

  const signedInWallets = useSignedInWallets();

  const { onUserInput, onCurrencySelection, onSwitchTokens, onPercentSelection } = useSwapActionHandlers();

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value);
    },
    [onUserInput],
  );

  const handleTypeOutput = useCallback(
    (value: string) => {
      onUserInput(Field.OUTPUT, value);
    },
    [onUserInput],
  );

  const maxInputAmount = useMemo(
    () => maxAmountSpend(currencyBalances[Field.INPUT], direction.from),
    [currencyBalances, direction.from],
  );

  const handleInputSelect = useCallback(
    (inputCurrency: XToken) => {
      onCurrencySelection(Field.INPUT, inputCurrency);
    },
    [onCurrencySelection],
  );

  const handleOutputSelect = useCallback(
    (outputCurrency: XToken) => {
      onCurrencySelection(Field.OUTPUT, outputCurrency);
    },
    [onCurrencySelection],
  );

  const handleInputPercentSelect = useCallback(
    (percent: number) => {
      maxInputAmount &&
        onPercentSelection(Field.INPUT, percent, maxInputAmount.multiply(new Percent(percent, 100)).toFixed(4));
    },
    [onPercentSelection, maxInputAmount],
  );

  const handleMaximumBridgeAmountClick = () => {
    if (maximumBridgeAmount) {
      onUserInput(Field.OUTPUT, maximumBridgeAmount?.toFixed(4));
    }
  };

  return (
    <div className="flex flex-col">
      <div className="pt-10 pb-16 px-[60px] flex flex-col bg-[rgba(105,86,130,0.3)] rounded-[24px] backdrop-blur-[50px]">
        <div className="flex flex-col gap-4 justify-center items-center">
          <div className="flex flex-col">
            <label className="text-[#685682] text-[10px] font-semibold uppercase leading-3 text-center mb-1">
              You swap
            </label>
            <CurrencyInputPanel
              account={account}
              value={
                mmTrade.isMMBetter ? mmTrade.trade?.inputAmount.toSignificant() ?? '' : formattedAmounts[Field.INPUT]
              }
              currency={currencies[Field.INPUT]}
              onUserInput={handleTypeInput}
              onCurrencySelect={handleInputSelect}
              onPercentSelect={signedInWallets.length > 0 ? handleInputPercentSelect : undefined}
              type={CurrencyInputPanelType.INPUT}
              balance={currencyBalances[Field.INPUT]}
            />
          </div>

          <div className="cursor-pointer" onClick={onSwitchTokens}>
            <SwitchGradientIcon />
          </div>

          <div className="gradient-border-mask flex flex-col px-4 pb-4 pt-6 relative mt-1 mb-2">
            <label className="absolute -top-1 inset-x-0 text-center text-[#685682] text-[10px] font-semibold uppercase leading-3">
              You receive
            </label>
            <CurrencyInputPanel
              account={account}
              value={
                mmTrade.isMMBetter ? mmTrade.trade?.outputAmount.toSignificant() ?? '' : formattedAmounts[Field.OUTPUT]
              }
              currency={currencies[Field.OUTPUT]}
              onUserInput={handleTypeOutput}
              onCurrencySelect={handleOutputSelect}
              type={CurrencyInputPanelType.OUTPUT}
              showWarning={!!(!canBridge && maximumBridgeAmount)}
            />
            <RecipientAddressPanel />
          </div>
        </div>

        <div className="flex flex-col justify-center">
          {!mmTrade.isMMBetter && <SwapCommitButton />}
          <MMSwapCommitButton
            hidden={!mmTrade.isMMBetter}
            currencies={currencies}
            account={account}
            recipient={recipient}
            trade={mmTrade.trade}
            direction={direction}
            inputError={inputError}
          />
        </div>

        {!canBridge && maximumBridgeAmount && (
          <BridgeLimitWarning limitAmount={maximumBridgeAmount} onLimitAmountClick={handleMaximumBridgeAmountClick} />
        )}
      </div>

      {xTransactionType &&
        xTransactionType !== XTransactionType.BRIDGE &&
        (mmTrade.isMMBetter ? <MMAdvancedSwapDetails /> : <AdvancedSwapDetails />)}
    </div>
  );
}
