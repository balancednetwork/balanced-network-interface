import React, { useCallback } from 'react';

import { Currency, Percent, TradeType } from '@balancednetwork/sdk-core';
import { Trade } from '@balancednetwork/v1-sdk';
import { Trans, t } from '@lingui/macro';
import BigNumber from 'bignumber.js';

import { UnderlineText } from '@/app/components/DropdownText';
import CurrencyInputPanel from '@/app/components2/CurrencyInputPanel';
import { Typography } from '@/app/theme';
import FlipIcon from '@/assets/icons/flip.svg';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SLIPPAGE_WARNING_THRESHOLD } from '@/constants/misc';
import useManualAddresses from '@/hooks/useManualAddresses';
import { MODAL_ID, modalActions } from '@/hooks/useModalStore';
import { useSignedInWallets } from '@/hooks/useWallets';
import { useSwapSlippageTolerance, useWalletModalToggle } from '@/store/application/hooks';
import { useDerivedSwapInfo, useInitialSwapLoad, useSwapActionHandlers, useSwapState } from '@/store/swap/hooks';
import { Field } from '@/store/swap/reducer';
import { formatPercent, maxAmountSpend } from '@/utils';
import { getXChainType } from '@/xwagmi/actions';
import { xChainMap } from '@/xwagmi/constants/xChains';
import { useXAccount } from '@/xwagmi/hooks';
import { XChainId } from '@balancednetwork/sdk-core';
import AdvancedSwapDetails from './AdvancedSwapDetails';
import SwapModal from './SwapModal';
import XSwapModal from './XSwapModal';

export default function SwapPanel() {
  useInitialSwapLoad();

  const {
    trade,
    currencyBalances,
    currencies,
    inputError,
    percents,
    account,
    direction,
    formattedAmounts,
    maximumBridgeAmount,
    canBridge,
  } = useDerivedSwapInfo();
  const showSlippageWarning = trade?.priceImpact.greaterThan(SLIPPAGE_WARNING_THRESHOLD);

  const signedInWallets = useSignedInWallets();
  const { recipient } = useSwapState();
  const isRecipientCustom = recipient !== null && !signedInWallets.some(wallet => wallet.address === recipient);

  const { onUserInput, onCurrencySelection, onSwitchTokens, onPercentSelection, onChangeRecipient, onChainSelection } =
    useSwapActionHandlers();

  const handleSwapInputChainSelection = useCallback(
    (xChainId: XChainId) => {
      onChainSelection(Field.INPUT, xChainId);
    },
    [onChainSelection],
  );
  const handleSwapOutputChainSelection = useCallback(
    (xChainId: XChainId) => {
      onChainSelection(Field.OUTPUT, xChainId);
    },
    [onChainSelection],
  );

  const xAccount = useXAccount(getXChainType(direction.to));

  const { manualAddresses } = useManualAddresses();

  React.useEffect(() => {
    if (manualAddresses[direction.to]) {
      onChangeRecipient(manualAddresses[direction.to] ?? null);
    } else if (xAccount.address) {
      onChangeRecipient(xAccount.address);
    } else {
      onChangeRecipient(null);
    }
  }, [onChangeRecipient, xAccount, manualAddresses[direction.to], direction.to]);

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

  const clearSwapInputOutput = useCallback((): void => {
    handleTypeInput('');
    handleTypeOutput('');
  }, [handleTypeInput, handleTypeOutput]);

  const maxInputAmount = React.useMemo(
    () => maxAmountSpend(currencyBalances[Field.INPUT], direction.from),
    [currencyBalances, direction.from],
  );

  const handleInputSelect = useCallback(
    (inputCurrency: Currency) => {
      onCurrencySelection(Field.INPUT, inputCurrency);
    },
    [onCurrencySelection],
  );

  const handleOutputSelect = useCallback(
    (outputCurrency: Currency) => {
      onCurrencySelection(Field.OUTPUT, outputCurrency);
    },
    [onCurrencySelection],
  );

  const handleInputPercentSelect = useCallback(
    (percent: number) => {
      maxInputAmount &&
        onPercentSelection(Field.INPUT, percent, maxInputAmount.multiply(new Percent(percent, 100)).toFixed());
    },
    [onPercentSelection, maxInputAmount],
  );

  const slippageTolerance = useSwapSlippageTolerance();
  const isValid = !inputError && canBridge;

  // handle swap modal
  const [showSwapConfirm, setShowSwapConfirm] = React.useState(false);

  const handleSwapConfirmDismiss = React.useCallback(
    (clearInputs = true) => {
      setShowSwapConfirm(false);
      clearInputs && clearSwapInputOutput();
    },
    [clearSwapInputOutput],
  );

  const toggleWalletModal = useWalletModalToggle();

  const [executionTrade, setExecutionTrade] = React.useState<Trade<Currency, Currency, TradeType>>();

  const isXSwap = !(direction.from === '0x1.icon' && direction.to === '0x1.icon');

  const handleSwap = useCallback(() => {
    if (isXSwap) {
      if (!account || !recipient) {
        toggleWalletModal();
      } else {
        setExecutionTrade(trade);
        modalActions.openModal(MODAL_ID.XSWAP_CONFIRM_MODAL);
      }
    } else {
      if (!account) {
        toggleWalletModal();
      } else {
        setShowSwapConfirm(true);
        setExecutionTrade(trade);
      }
    }
  }, [account, toggleWalletModal, trade, isXSwap, recipient]);

  const minimumToReceive = trade?.minimumAmountOut(new Percent(slippageTolerance, 10_000));
  const priceImpact = formatPercent(new BigNumber(trade?.priceImpact.toFixed() || 0));

  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);

  const arrowRef = React.useRef(null);

  const handleMaximumBridgeAmountClick = () => {
    if (maximumBridgeAmount) {
      onUserInput(Field.OUTPUT, maximumBridgeAmount?.toFixed(4));
    }
  };

  const swapButton = isValid ? (
    <Button variant="default" onClick={handleSwap} className="w-full rounded-xl">
      <Trans>Swap</Trans>
    </Button>
  ) : (
    <Button
      disabled={!account || !!inputError || !canBridge}
      color="primary"
      onClick={handleSwap}
      className="w-full rounded-3xl"
    >
      {inputError || t`Swap`}
    </Button>
  );

  return (
    <>
      <div className="px-3 py-7 flex flex-col">
        <div className="flex flex-col gap-4 items-stretch">
          {/* <div className="flex items-end justify-between">
            <Typography variant="h2">
              <Trans>You pay</Trans>
            </Typography>
            <Typography className="text-foreground" as="div" hidden={!account}>
              <Trans>Wallet:</Trans>{' '}
              {`${
                currencyBalances[Field.INPUT] ? currencyBalances[Field.INPUT]?.toFixed(4, { groupSeparator: ',' }) : 0
              } 
                ${currencies[Field.INPUT]?.symbol}`}
            </Typography>
          </div> */}

          <CurrencyInputPanel
            account={account}
            value={formattedAmounts[Field.INPUT]}
            currency={currencies[Field.INPUT]}
            onUserInput={handleTypeInput}
            onCurrencySelect={handleInputSelect}
            onPercentSelect={signedInWallets.length > 0 ? handleInputPercentSelect : undefined}
            percent={percents[Field.INPUT]}
          />

          <div className="flex items-center justify-center">
            <div className="cursor-pointer" onClick={onSwitchTokens}>
              <FlipIcon width={25} height={17} />
            </div>
          </div>

          {/* <div className="flex items-center justify-between">
            <Typography variant="h2">
              <Trans>You receive</Trans>
            </Typography>
            <Typography className="text-foreground" as="div" hidden={!recipient}>
              {recipient && (
                <>
                  <Trans>Wallet:</Trans>{' '}
                  {isRecipientCustom ? (
                    <Trans>Custom</Trans>
                  ) : (
                    `${
                      currencyBalances[Field.OUTPUT]
                        ? currencyBalances[Field.OUTPUT]?.toFixed(4, { groupSeparator: ',' })
                        : 0
                    } 
                ${currencies[Field.OUTPUT]?.symbol}`
                  )}
                </>
              )}
            </Typography>
          </div> */}

          <CurrencyInputPanel
            account={account}
            value={formattedAmounts[Field.OUTPUT]}
            currency={currencies[Field.OUTPUT]}
            onUserInput={handleTypeOutput}
            onCurrencySelect={handleOutputSelect}
          />

          <Collapsible>
            <CollapsibleTrigger>1 ICX = 0.1315USDC</CollapsibleTrigger>
            <CollapsibleContent>
              <div className="flex items-center justify-between">
                <Typography className="text-secondary">
                  <Trans>Price impact</Trans>
                </Typography>

                <Typography
                  className={showSlippageWarning ? 'error-anim' : ''}
                  color={showSlippageWarning ? 'alert' : 'text'}
                >
                  {priceImpact}
                </Typography>
              </div>
              <div className="flex flex-col justify-between">
                <div className="flex justify-between gap-2">
                  <Typography className="text-secondary">
                    <Trans>Minimum to receive</Trans>
                  </Typography>
                  <span>
                    {minimumToReceive
                      ? `${minimumToReceive?.toFixed(4)} ${minimumToReceive?.currency.symbol}`
                      : `0 ${currencies[Field.OUTPUT]?.symbol}`}
                  </span>
                </div>
                <AdvancedSwapDetails />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="flex justify-center">{swapButton}</div>

          {!canBridge && maximumBridgeAmount && (
            <div className="flex items-center justify-center mt-2">
              <Typography textAlign="center">
                {new BigNumber(maximumBridgeAmount.toFixed()).isGreaterThanOrEqualTo(0.0001) ? (
                  <>
                    <Trans>Only</Trans>{' '}
                    <UnderlineText onClick={handleMaximumBridgeAmountClick}>
                      <Typography color="primaryBright" as="a">
                        {maximumBridgeAmount?.toFixed(4)} {maximumBridgeAmount?.currency?.symbol}
                      </Typography>
                    </UnderlineText>{' '}
                  </>
                ) : (
                  <>
                    <Trans>0 {maximumBridgeAmount?.currency?.symbol}</Trans>{' '}
                  </>
                )}

                <Trans>is available on {xChainMap[direction?.to].name}.</Trans>
              </Typography>
            </div>
          )}
        </div>
      </div>

      <SwapModal
        isOpen={showSwapConfirm}
        onClose={handleSwapConfirmDismiss}
        account={account}
        currencies={currencies}
        executionTrade={executionTrade}
        recipient={recipient || undefined}
      />

      <XSwapModal
        account={account}
        currencies={currencies}
        executionTrade={executionTrade}
        direction={direction}
        recipient={recipient}
        clearInputs={clearSwapInputOutput}
      />
    </>
  );
}
