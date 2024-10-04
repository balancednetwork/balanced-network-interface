import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Currency, CurrencyAmount, Percent, TradeType, XToken } from '@balancednetwork/sdk-core';
import { Trade } from '@balancednetwork/v1-sdk';
import { Trans, t } from '@lingui/macro';
import BigNumber from 'bignumber.js';

import CurrencyInputPanel, { CurrencyInputPanelType } from '@/app/components2/CurrencyInputPanel';
import FlipIcon from '@/assets/icons/flip.svg';
import { Button } from '@/components/ui/button';
import { ApprovalState, useApproveCallback } from '@/hooks/useApproveCallback';
import { useSendXTransaction } from '@/hooks/useSendXTransaction';
import { useSignedInWallets } from '@/hooks/useWallets';
import { useSwapSlippageTolerance, useWalletModalToggle } from '@/store/application/hooks';
import { useDerivedSwapInfo, useInitialSwapLoad, useSwapActionHandlers, useSwapState } from '@/store/swap/hooks';
import { Field } from '@/store/swap/reducer';
import { maxAmountSpend } from '@/utils';
import { showMessageOnBeforeUnload } from '@/utils/messages';
import { getXChainType } from '@/xwagmi/actions';
import { xChainMap } from '@/xwagmi/constants/xChains';
import { useXAccount } from '@/xwagmi/hooks';
import useXCallFee from '@/xwagmi/xcall/hooks/useXCallFee';
import { XTransactionInput, XTransactionType } from '@/xwagmi/xcall/types';
import AdvancedSwapDetails from './AdvancedSwapDetails';
import RecipientAddressPanel from './RecipientAddressPanel';
import XSwapModal, { ConfirmModalState, PendingConfirmModalState } from './XSwapModal';

interface XSwapModalState {
  confirmModalState: ConfirmModalState;
  xSwapErrorMessage: string | undefined;
  attemptingTxn: boolean;
  xTransactionId: string | undefined;
}

const DEFAULT_XSWAP_MODAL_STATE: XSwapModalState = {
  confirmModalState: ConfirmModalState.REVIEWING,
  xSwapErrorMessage: '',
  attemptingTxn: false,
  xTransactionId: '',
};

export default function SwapPanel() {
  const [open, setOpen] = useState(false);

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
    xTransactionType,
    parsedAmount,
  } = useDerivedSwapInfo();

  const signedInWallets = useSignedInWallets();
  const { recipient } = useSwapState();

  const { onUserInput, onCurrencySelection, onSwitchTokens, onPercentSelection, onChangeRecipient } =
    useSwapActionHandlers();

  const [xSwapModalState, setXSwapModalState] = useState<XSwapModalState>(DEFAULT_XSWAP_MODAL_STATE);

  const xAccount = useXAccount(getXChainType(direction.to));

  useEffect(() => {
    if (xAccount.address) {
      onChangeRecipient(xAccount.address);
    } else {
      onChangeRecipient(null);
    }
  }, [onChangeRecipient, xAccount]);

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
        onPercentSelection(Field.INPUT, percent, maxInputAmount.multiply(new Percent(percent, 100)).toFixed());
    },
    [onPercentSelection, maxInputAmount],
  );

  const isValid = !inputError && canBridge;

  const toggleWalletModal = useWalletModalToggle();

  const [executionTrade, setExecutionTrade] = useState<Trade<Currency, Currency, TradeType>>();

  const handleOpenXSwapModal = useCallback(() => {
    if (!account || !recipient) {
      toggleWalletModal();
    } else {
      setExecutionTrade(trade);
      setOpen(true);
    }
  }, [account, toggleWalletModal, trade, recipient]);

  const handleMaximumBridgeAmountClick = () => {
    if (maximumBridgeAmount) {
      onUserInput(Field.OUTPUT, maximumBridgeAmount?.toFixed(4));
    }
  };

  const swapButton = useMemo(() => {
    return isValid ? (
      <Button
        variant="default"
        onClick={handleOpenXSwapModal}
        className="w-full rounded-full h-[56px] font-bold text-base"
      >
        <Trans>Swap</Trans>
      </Button>
    ) : (
      <Button
        disabled={!account || !!inputError || !canBridge}
        color="primary"
        onClick={handleOpenXSwapModal}
        className="w-full rounded-full h-[56px] font-bold text-base"
      >
        {inputError || t`Swap`}
      </Button>
    );
  }, [isValid, account, inputError, canBridge, handleOpenXSwapModal]);

  // -------------------------------XSWAP--------------------------------
  const [pendingModalSteps, setPendingModalSteps] = useState<PendingConfirmModalState[]>([]);

  const handleDismiss = useCallback(() => {
    setOpen(false);
    setTimeout(() => {
      setXSwapModalState(DEFAULT_XSWAP_MODAL_STATE);
    }, 500);
  }, []);

  const xChain = xChainMap[direction.from];
  const _inputAmount = useMemo(() => {
    if (xTransactionType === XTransactionType.BRIDGE && currencies[Field.INPUT] && parsedAmount) {
      return CurrencyAmount.fromRawAmount(
        XToken.getXToken(direction.from, currencies[Field.INPUT].wrapped),
        new BigNumber(parsedAmount.toFixed())
          .times((10n ** BigInt(currencies[Field.INPUT].decimals)).toString())
          .toFixed(0),
      );
    }
    return executionTrade?.inputAmount && currencies[Field.INPUT]
      ? CurrencyAmount.fromRawAmount(
          XToken.getXToken(direction.from, currencies[Field.INPUT].wrapped),
          new BigNumber(executionTrade.inputAmount.toFixed())
            .times((10n ** BigInt(currencies[Field.INPUT].decimals)).toString())
            .toFixed(0),
        )
      : undefined;
  }, [executionTrade, direction.from, currencies, xTransactionType, parsedAmount]);
  const { approvalState, approveCallback } = useApproveCallback(_inputAmount, xChain.contracts.assetManager);

  const { xCallFee, formattedXCallFee } = useXCallFee(direction.from, direction.to);
  const slippageTolerance = useSwapSlippageTolerance();
  const { sendXTransaction } = useSendXTransaction();

  const cleanupSwap = useCallback(() => {
    clearSwapInputOutput();
    window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
  }, [clearSwapInputOutput]);

  const handleConfirmXSwap = useCallback(async () => {
    if (xTransactionType === XTransactionType.SWAP_ON_ICON) {
      await handleConfirmSwap();
      return;
    }

    if (!xTransactionType) return;
    // if (!executionTrade) return;
    if (!account) return;
    if (!recipient) return;
    if (!xCallFee) return;
    if (!_inputAmount) return;

    const pendingModalSteps: PendingConfirmModalState[] = [];
    if (approvalState !== ApprovalState.APPROVED) {
      pendingModalSteps.push(ConfirmModalState.APPROVING_TOKEN);
    }
    pendingModalSteps.push(ConfirmModalState.PENDING_CONFIRMATION);
    setPendingModalSteps(pendingModalSteps);

    if (approvalState !== ApprovalState.APPROVED) {
      setXSwapModalState({
        confirmModalState: ConfirmModalState.APPROVING_TOKEN,
        xSwapErrorMessage: '',
        attemptingTxn: true,
        xTransactionId: '',
      });

      await approveCallback();

      // setXSwapModalState({
      //   confirmModalState: ConfirmModalState.APPROVING_TOKEN,
      //   xSwapErrorMessage: '',
      //   attemptingTxn: false,
      //   xTransactionId: '',
      // });
    }

    setXSwapModalState({
      confirmModalState: ConfirmModalState.PENDING_CONFIRMATION,
      xSwapErrorMessage: '',
      attemptingTxn: true,
      xTransactionId: '',
    });

    const xTransactionInput: XTransactionInput = {
      type: xTransactionType,
      direction,
      executionTrade,
      account,
      recipient,
      inputAmount: _inputAmount,
      xCallFee,
      callback: cleanupSwap,
      slippageTolerance,
    };

    try {
      const xTransactionId = await sendXTransaction(xTransactionInput);
      console.log('xTransactionId', xTransactionId);

      if (!xTransactionId) {
        throw new Error('xTransactionId is undefined');
      }

      setXSwapModalState({
        confirmModalState: ConfirmModalState.PENDING_CONFIRMATION,
        xSwapErrorMessage: '',
        attemptingTxn: false,
        xTransactionId,
      });
    } catch (e) {
      console.log(e);
      setXSwapModalState(DEFAULT_XSWAP_MODAL_STATE);
    }
  }, [
    sendXTransaction,
    executionTrade,
    account,
    recipient,
    _inputAmount,
    direction,
    xCallFee,
    approvalState,
    approveCallback,
    cleanupSwap,
    slippageTolerance,
    xTransactionType,
  ]);

  const handleConfirmSwap = useCallback(async () => {
    // if (!executionTrade) return;
    if (!account) return;
    if (!recipient) return;
    if (!_inputAmount) return;

    setPendingModalSteps([ConfirmModalState.PENDING_CONFIRMATION]);

    setXSwapModalState({
      confirmModalState: ConfirmModalState.PENDING_CONFIRMATION,
      xSwapErrorMessage: '',
      attemptingTxn: true,
      xTransactionId: '',
    });

    const xTransactionInput: XTransactionInput = {
      type: XTransactionType.SWAP_ON_ICON,
      direction,
      executionTrade,
      account,
      recipient,
      xCallFee: { rollback: 0n, noRollback: 0n }, // not used, just for type checking
      inputAmount: _inputAmount,
      callback: cleanupSwap,
      slippageTolerance,
    };

    try {
      const xTransactionId = await sendXTransaction(xTransactionInput);
      console.log('xTransactionId', xTransactionId);

      if (!xTransactionId) {
        throw new Error('xTransactionId is undefined');
      }

      setXSwapModalState({
        confirmModalState: ConfirmModalState.PENDING_CONFIRMATION,
        xSwapErrorMessage: '',
        attemptingTxn: false,
        xTransactionId,
      });
    } catch (e) {
      console.log(e);
      setXSwapModalState(DEFAULT_XSWAP_MODAL_STATE);
    }
  }, [sendXTransaction, executionTrade, account, recipient, _inputAmount, direction, cleanupSwap, slippageTolerance]);

  return (
    <>
      <div className="py-4 flex flex-col">
        <div className="flex flex-col gap-4 items-stretch">
          <div className="flex flex-col gap-2">
            <CurrencyInputPanel
              account={account}
              value={formattedAmounts[Field.INPUT]}
              currency={currencies[Field.INPUT]}
              onUserInput={handleTypeInput}
              onCurrencySelect={handleInputSelect}
              onPercentSelect={signedInWallets.length > 0 ? handleInputPercentSelect : undefined}
              // percent={percents[Field.INPUT]}
              type={CurrencyInputPanelType.INPUT}
              balance={currencyBalances[Field.INPUT]}
            />

            <div className="relative flex items-center justify-center h-0 z-1">
              <div
                className="cursor-pointer w-[40px] h-[40px] bg-[#695682] rounded-full flex items-center justify-center"
                onClick={onSwitchTokens}
              >
                <FlipIcon width={24} height={24} />
              </div>
            </div>

            <CurrencyInputPanel
              account={account}
              value={formattedAmounts[Field.OUTPUT]}
              currency={currencies[Field.OUTPUT]}
              onUserInput={handleTypeOutput}
              onCurrencySelect={handleOutputSelect}
              type={CurrencyInputPanelType.OUTPUT}
            />
          </div>
          <RecipientAddressPanel />

          <div className="flex justify-center">{swapButton}</div>

          {xTransactionType === XTransactionType.BRIDGE && (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-secondary-foreground text-body">Bridge Fee</span>
                <span className="text-body">{formattedXCallFee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-foreground text-body">Network Cost</span>
                <span className="text-body">0.0001 ICX</span>
              </div>
            </div>
          )}
          {xTransactionType !== XTransactionType.BRIDGE && <AdvancedSwapDetails />}

          {!canBridge && maximumBridgeAmount && (
            <div className="flex items-center justify-center mt-2">
              <div className="text-center text-body">
                {new BigNumber(maximumBridgeAmount.toFixed()).isGreaterThanOrEqualTo(0.0001) ? (
                  <>
                    <Trans>Only</Trans>{' '}
                    <div className="hover:underline" onClick={handleMaximumBridgeAmountClick}>
                      {maximumBridgeAmount?.toFixed(4)} {maximumBridgeAmount?.currency?.symbol}
                    </div>{' '}
                  </>
                ) : (
                  <>
                    <Trans>0 {maximumBridgeAmount?.currency?.symbol}</Trans>{' '}
                  </>
                )}

                <Trans>is available on {xChainMap[direction?.to].name}.</Trans>
              </div>
            </div>
          )}
        </div>
      </div>

      <XSwapModal
        open={open}
        currencies={currencies}
        executionTrade={executionTrade}
        direction={direction}
        //
        // confirmModalState={xSwapModalState.confirmModalState}
        // xSwapErrorMessage={xSwapModalState.xSwapErrorMessage}
        // attemptingTxn={xSwapModalState.attemptingTxn}
        // xTransactionId={xSwapModalState.xTransactionId}
        {...xSwapModalState}
        pendingModalSteps={pendingModalSteps}
        approvalState={approvalState}
        //
        onConfirm={handleConfirmXSwap}
        onDismiss={handleDismiss}
      />
    </>
  );
}
