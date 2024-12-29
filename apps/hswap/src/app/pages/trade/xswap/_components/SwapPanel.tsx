import React, { useCallback, useMemo, useState } from 'react';

import { Percent } from '@balancednetwork/sdk-core';
import { Trans, t } from '@lingui/macro';

import { BlueButton } from '@/app/components2/Button';
import CurrencyInputPanel, { CurrencyInputPanelType } from '@/app/components2/CurrencyInputPanel';
import { SwitchGradientIcon } from '@/app/components2/Icons';
import { ApprovalState, useApproveCallback } from '@/hooks/useApproveCallback';
import { MODAL_ID, modalActions } from '@/hooks/useModalStore';
import { useSendXTransaction } from '@/hooks/useSendXTransaction';
import { useSignedInWallets } from '@/hooks/useWallets';
import { useSwapSlippageTolerance } from '@/store/application/hooks';
import { useDerivedSwapInfo, useInitialSwapLoad, useSwapActionHandlers, useSwapState } from '@/store/swap/hooks';
import { Field } from '@/store/swap/reducer';
import { maxAmountSpend } from '@/utils';
import { showMessageOnBeforeUnload } from '@/utils/messages';
import { getXChainType } from '@balancednetwork/xwagmi';
import { xChainMap } from '@balancednetwork/xwagmi';
import { useXAccount } from '@balancednetwork/xwagmi';
import { XToken } from '@balancednetwork/xwagmi';
import { useXCallFee } from '@balancednetwork/xwagmi';
import { XTransactionInput, XTransactionType } from '@balancednetwork/xwagmi';
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
    accounts,
    direction,
    formattedAmounts,
    maximumBridgeAmount,
    canBridge,
    xTransactionType,
    currencyAmounts,
  } = useDerivedSwapInfo();
  const account = accounts[Field.INPUT];
  const inputAmount = currencyAmounts[Field.INPUT];

  const signedInWallets = useSignedInWallets();
  const { recipient } = useSwapState();

  const { onUserInput, onCurrencySelection, onSwitchTokens, onPercentSelection } = useSwapActionHandlers();

  const [xSwapModalState, setXSwapModalState] = useState<XSwapModalState>(DEFAULT_XSWAP_MODAL_STATE);

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
        onPercentSelection(Field.INPUT, percent, maxInputAmount.multiply(new Percent(percent, 100)).toFixed(4));
    },
    [onPercentSelection, maxInputAmount],
  );

  const isValid = !inputError && canBridge;

  const handleMaximumBridgeAmountClick = () => {
    if (maximumBridgeAmount) {
      onUserInput(Field.OUTPUT, maximumBridgeAmount?.toFixed(4));
    }
  };

  // ----------------------------------------------------XSWAP------------------------------------------------------
  const handleDismiss = useCallback(() => {
    setOpen(false);
    setTimeout(() => {
      setXSwapModalState(DEFAULT_XSWAP_MODAL_STATE);
    }, 500);
  }, []);

  const [executionXTransactionInput, setExecutionXTransactionInput] = useState<XTransactionInput>();
  const [pendingModalSteps, setPendingModalSteps] = useState<PendingConfirmModalState[]>([]);
  const sourceXChain = xChainMap[direction.from];
  const { approvalState, approveCallback } = useApproveCallback(inputAmount, sourceXChain.contracts.assetManager);
  const { xCallFee } = useXCallFee(direction.from, direction.to);
  const slippageTolerance = useSwapSlippageTolerance();
  const { sendXTransaction } = useSendXTransaction();
  const cleanupSwap = useCallback(() => {
    clearSwapInputOutput();
    window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
  }, [clearSwapInputOutput]);

  const xTransactionInput = useMemo(() => {
    if (!account || !recipient || !inputAmount) return;

    let _xTransactionInput: XTransactionInput | undefined;
    if (xTransactionType === XTransactionType.SWAP_ON_ICON) {
      _xTransactionInput = {
        type: XTransactionType.SWAP_ON_ICON,
        direction,
        executionTrade: trade,
        account,
        recipient,
        xCallFee: { rollback: 0n, noRollback: 0n }, // not used, just for type checking
        inputAmount: inputAmount,
        callback: cleanupSwap,
        slippageTolerance,
      };
    } else if (xTransactionType === XTransactionType.BRIDGE || xTransactionType === XTransactionType.SWAP) {
      if (!xCallFee) return;

      _xTransactionInput = {
        type: xTransactionType,
        direction,
        executionTrade: trade,
        account,
        recipient,
        inputAmount: inputAmount,
        xCallFee,
        callback: cleanupSwap,
        slippageTolerance,
      };
    }
    return _xTransactionInput;
  }, [account, recipient, xTransactionType, direction, trade, inputAmount, xCallFee, cleanupSwap, slippageTolerance]);

  const handleOpenXSwapModal = useCallback(() => {
    if (!xTransactionInput) return;

    setExecutionXTransactionInput(xTransactionInput);
    setOpen(true);
  }, [xTransactionInput]);

  const outputAccount = useXAccount(getXChainType(currencies[Field.OUTPUT]?.xChainId));
  const swapButton = useMemo(() => {
    return !account ? (
      <BlueButton
        onClick={() => {
          modalActions.openModal(MODAL_ID.WALLET_CONNECT_MODAL);
        }}
      >
        <Trans>Sign in</Trans>
      </BlueButton>
    ) : isValid ? (
      <BlueButton onClick={handleOpenXSwapModal}>
        {recipient?.toLocaleLowerCase() === outputAccount.address?.toLocaleLowerCase() ? (
          <Trans>Swap to my wallet</Trans>
        ) : (
          <Trans>Swap to address</Trans>
        )}
      </BlueButton>
    ) : (
      <BlueButton disabled={!account || !!inputError || !canBridge} onClick={handleOpenXSwapModal}>
        {inputError || t`Swap`}
      </BlueButton>
    );
  }, [isValid, account, inputError, canBridge, handleOpenXSwapModal, recipient, outputAccount.address]);

  const handleApprove = useCallback(async () => {
    if (!approvalState || approvalState !== ApprovalState.NOT_APPROVED) return;

    try {
      const pendingModalSteps: PendingConfirmModalState[] = [];

      pendingModalSteps.push(ConfirmModalState.APPROVING_TOKEN);
      setPendingModalSteps(pendingModalSteps);

      setXSwapModalState({
        confirmModalState: ConfirmModalState.APPROVING_TOKEN,
        xSwapErrorMessage: '',
        attemptingTxn: true,
        xTransactionId: '',
      });

      await approveCallback();
    } catch (e) {
      console.log('approve failed', e);
    }

    setXSwapModalState(DEFAULT_XSWAP_MODAL_STATE);
  }, [approvalState, approveCallback]);

  const handleConfirmXSwap = useCallback(async () => {
    if (!executionXTransactionInput) return;

    const pendingModalSteps: PendingConfirmModalState[] = [];
    pendingModalSteps.push(ConfirmModalState.PENDING_CONFIRMATION);
    setPendingModalSteps(pendingModalSteps);

    setXSwapModalState({
      confirmModalState: ConfirmModalState.PENDING_CONFIRMATION,
      xSwapErrorMessage: '',
      attemptingTxn: true,
      xTransactionId: '',
    });

    try {
      const xTransactionId = await sendXTransaction(executionXTransactionInput);

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
  }, [sendXTransaction, executionXTransactionInput]);

  return (
    <>
      <div className="flex flex-col">
        <div className="pt-10 pb-16 px-[60px] flex flex-col bg-[rgba(105,86,130,0.3)] rounded-[24px] backdrop-blur-[50px]">
          <div className="flex flex-col gap-4 justify-center items-center">
            <div className="flex flex-col">
              <label className="text-[#685682] text-[10px] font-semibold uppercase leading-3 text-center mb-1">
                You swap
              </label>
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
                value={formattedAmounts[Field.OUTPUT]}
                currency={currencies[Field.OUTPUT]}
                onUserInput={handleTypeOutput}
                onCurrencySelect={handleOutputSelect}
                type={CurrencyInputPanelType.OUTPUT}
                showWarning={!!(!canBridge && maximumBridgeAmount)}
              />
              <RecipientAddressPanel />
            </div>
          </div>

          <div className="flex justify-center">{swapButton}</div>

          {!canBridge && maximumBridgeAmount && (
            <div className="flex items-center justify-center mt-2">
              <div className="text-center text-[14px]">
                <Trans>Max</Trans>{' '}
                <span
                  className="text-warning font-bold hover:underline cursor-pointer"
                  onClick={handleMaximumBridgeAmountClick}
                >
                  {maximumBridgeAmount?.toFixed(4)}
                </span>{' '}
                {maximumBridgeAmount?.currency?.symbol}
              </div>
            </div>
          )}
        </div>

        {xTransactionType && xTransactionType !== XTransactionType.BRIDGE && (
          <AdvancedSwapDetails xTransactionInput={xTransactionInput} />
        )}
      </div>

      {executionXTransactionInput && (
        <XSwapModal
          open={open}
          currencies={currencies}
          executionXTransactionInput={executionXTransactionInput}
          //
          // confirmModalState={xSwapModalState.confirmModalState}
          // xSwapErrorMessage={xSwapModalState.xSwapErrorMessage}
          // attemptingTxn={xSwapModalState.attemptingTxn}
          // xTransactionId={xSwapModalState.xTransactionId}
          {...xSwapModalState}
          pendingModalSteps={pendingModalSteps}
          approvalState={approvalState}
          //
          onApprove={handleApprove}
          onConfirm={handleConfirmXSwap}
          onDismiss={handleDismiss}
        />
      )}
    </>
  );
}
