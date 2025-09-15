import React, { useCallback, useState, useMemo } from 'react';

import { convertCurrencyAmount, getXChainType, useSendXTransaction } from '@balancednetwork/xwagmi';
import { useXAccount } from '@balancednetwork/xwagmi';
import { xChainMap } from '@balancednetwork/xwagmi';
import { useXCallFee } from '@balancednetwork/xwagmi';
import { XTransactionInput, XTransactionType } from '@balancednetwork/xwagmi';
import { Trans, t } from '@lingui/macro';

import { BlueButton } from '@/app/components/Button';
import { ApprovalState, useApproveCallback } from '@/hooks/useApproveCallback';
import { MODAL_ID, modalActions } from '@/hooks/useModalStore';
import { useSwapSlippageTolerance } from '@/store/application/hooks';
import { useDerivedSwapInfo, useSwapActionHandlers, useSwapState } from '@/store/swap/hooks';
import { Field } from '@/store/swap/reducer';
import { Currency, Percent, TradeType } from '@balancednetwork/sdk-core';
import { Trade } from '@balancednetwork/v1-sdk';
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

function SwapCommitButton() {
  const [open, setOpen] = useState(false);
  const [xSwapModalState, setXSwapModalState] = useState<XSwapModalState>(DEFAULT_XSWAP_MODAL_STATE);

  const { recipient } = useSwapState();

  const {
    trade,
    currencies,
    inputError,
    outputError,
    accounts,
    direction,
    canBridge,
    xTransactionType,
    currencyAmounts,
  } = useDerivedSwapInfo();
  const account = accounts[Field.INPUT];
  const inputAmount = currencyAmounts[Field.INPUT];

  const { xCallFee } = useXCallFee(direction.from, direction.to);
  const slippageTolerance = useSwapSlippageTolerance();
  const error = inputError || outputError;
  const isValid = !error && canBridge;

  const { onUserInput } = useSwapActionHandlers();

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

  const cleanupSwap = useCallback(() => {
    clearSwapInputOutput();
  }, [clearSwapInputOutput]);

  const sourceXChain = xChainMap[direction.from];
  const { approvalState, approveCallback } = useApproveCallback(inputAmount, sourceXChain.contracts.assetManager);

  const xTransactionInput = useMemo(() => {
    if (!account || !recipient || !inputAmount) return;

    let _xTransactionInput: XTransactionInput | undefined;
    if (xTransactionType === XTransactionType.SWAP_ON_ICON) {
      if (!trade) return;

      _xTransactionInput = {
        type: XTransactionType.SWAP_ON_ICON,
        direction,
        account,
        recipient,
        inputAmount,
        outputAmount: convertCurrencyAmount(direction.to, trade.outputAmount),
        minReceived: convertCurrencyAmount(
          direction.to,
          trade.minimumAmountOut(new Percent(slippageTolerance, 10_000)),
        ),
        xCallFee: { rollback: 0n, noRollback: 0n },
        path: trade.route.routeActionPath,
      };
    } else if (xTransactionType === XTransactionType.SWAP) {
      if (!xCallFee || !trade) return;

      _xTransactionInput = {
        type: xTransactionType,
        direction,
        account,
        recipient,
        inputAmount,
        outputAmount: convertCurrencyAmount(direction.to, trade.outputAmount),
        minReceived: convertCurrencyAmount(
          direction.to,
          trade.minimumAmountOut(new Percent(slippageTolerance, 10_000)),
        ),
        xCallFee,
        path: trade.route.routeActionPath,
      };
    } else if (xTransactionType === XTransactionType.BRIDGE) {
      if (!xCallFee) return;
      _xTransactionInput = {
        type: xTransactionType,
        direction,
        account,
        recipient,
        inputAmount,
        outputAmount: convertCurrencyAmount(direction.to, inputAmount),
        minReceived: convertCurrencyAmount(direction.to, inputAmount),
        xCallFee,
      };
    }
    return _xTransactionInput;
  }, [account, recipient, xTransactionType, direction, trade, inputAmount, xCallFee, slippageTolerance]);

  const handleOpenXSwapModal = useCallback(() => {
    if (!xTransactionInput) return;

    setExecutionXTransactionInput(xTransactionInput);
    setExecutionTrade(trade);
    setOpen(true);
  }, [xTransactionInput, trade]);

  const sendXTransaction = useSendXTransaction();

  const outputAccount = useXAccount(getXChainType(currencies[Field.OUTPUT]?.xChainId));

  // ----------------------------------------------------XSWAP------------------------------------------------------
  const handleDismiss = useCallback(() => {
    setOpen(false);
    setTimeout(() => {
      setXSwapModalState(DEFAULT_XSWAP_MODAL_STATE);
    }, 500);
  }, []);

  const [executionTrade, setExecutionTrade] = useState<Trade<Currency, Currency, TradeType>>();
  const [executionXTransactionInput, setExecutionXTransactionInput] = useState<XTransactionInput>();
  const [pendingModalSteps, setPendingModalSteps] = useState<PendingConfirmModalState[]>([]);

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
      cleanupSwap();
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
  }, [sendXTransaction, executionXTransactionInput, cleanupSwap]);

  return (
    <>
      {!account ? (
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
        <BlueButton disabled={!account || !!error || !canBridge} onClick={handleOpenXSwapModal}>
          {error || t`Swap`}
        </BlueButton>
      )}
      {executionXTransactionInput && (
        <XSwapModal
          open={open}
          currencies={currencies}
          executionXTransactionInput={executionXTransactionInput}
          executionTrade={executionTrade}
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

export default SwapCommitButton;
