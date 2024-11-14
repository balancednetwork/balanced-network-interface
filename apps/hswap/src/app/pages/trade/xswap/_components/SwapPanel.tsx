import React, { useCallback, useMemo, useState } from 'react';

import { CurrencyAmount, Percent, XToken } from '@balancednetwork/sdk-core';
import { Trans, t } from '@lingui/macro';
import BigNumber from 'bignumber.js';

import CurrencyInputPanel, { CurrencyInputPanelType } from '@/app/components2/CurrencyInputPanel';
import FlipIcon from '@/assets/icons/flip.svg';
import { Button } from '@/components/ui/button';
import { ApprovalState, useApproveCallback } from '@/hooks/useApproveCallback';
import { MODAL_ID, modalActions } from '@/hooks/useModalStore';
import { useSendXTransaction } from '@/hooks/useSendXTransaction';
import { useSignedInWallets } from '@/hooks/useWallets';
import { useSwapSlippageTolerance } from '@/store/application/hooks';
import { useDerivedSwapInfo, useInitialSwapLoad, useSwapActionHandlers, useSwapState } from '@/store/swap/hooks';
import { Field } from '@/store/swap/reducer';
import { maxAmountSpend } from '@/utils';
import { showMessageOnBeforeUnload } from '@/utils/messages';
import { xChainMap } from '@/xwagmi/constants/xChains';
import useXCallFee from '@/xwagmi/xcall/hooks/useXCallFee';
import { XTransactionInput, XTransactionType } from '@/xwagmi/xcall/types';
import AdvancedSwapDetails from './AdvancedSwapDetails';
import RecipientAddressPanel from './RecipientAddressPanel';
import XSwapModal, { ConfirmModalState, PendingConfirmModalState } from './XSwapModal';
import MarshFlyingSrc from '@/assets/images/marsh-flying.png';
import SwitchGradientIcon from '@/assets/icons2/switch-gradient.svg';
import { BlueButton } from '@/app/components2/Button';

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
        onPercentSelection(Field.INPUT, percent, maxInputAmount.multiply(new Percent(percent, 100)).toFixed());
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

  const inputAmount: CurrencyAmount<XToken> | undefined = useMemo(() => {
    if (xTransactionType === XTransactionType.BRIDGE && currencies[Field.INPUT] && parsedAmount) {
      return CurrencyAmount.fromRawAmount(
        XToken.getXToken(direction.from, currencies[Field.INPUT].wrapped),
        new BigNumber(parsedAmount.toFixed())
          .times((10n ** BigInt(currencies[Field.INPUT].decimals)).toString())
          .toFixed(0),
      );
    }
    return trade?.inputAmount && currencies[Field.INPUT]
      ? CurrencyAmount.fromRawAmount(
          XToken.getXToken(direction.from, currencies[Field.INPUT].wrapped),
          new BigNumber(trade.inputAmount.toFixed())
            .times((10n ** BigInt(currencies[Field.INPUT].decimals)).toString())
            .toFixed(0),
        )
      : undefined;
  }, [trade, direction.from, currencies, xTransactionType, parsedAmount]);

  const [executionXTransactionInput, setExecutionXTransactionInput] = useState<XTransactionInput>();
  const [pendingModalSteps, setPendingModalSteps] = useState<PendingConfirmModalState[]>([]);
  const sourceXChain = xChainMap[direction.from];
  const { approvalState, approveCallback } = useApproveCallback(inputAmount, sourceXChain.contracts.assetManager);
  const { xCallFee, formattedXCallFee } = useXCallFee(direction.from, direction.to);
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
        <Trans>Swap</Trans>
      </BlueButton>
    ) : (
      <BlueButton disabled={!account || !!inputError || !canBridge} onClick={handleOpenXSwapModal}>
        {inputError || t`Swap`}
      </BlueButton>
    );
  }, [isValid, account, inputError, canBridge, handleOpenXSwapModal]);

  const handleConfirmXSwap = useCallback(async () => {
    if (!executionXTransactionInput) return;

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

    try {
      const xTransactionId = await sendXTransaction(executionXTransactionInput);
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
  }, [sendXTransaction, executionXTransactionInput, approvalState, approveCallback]);

  return (
    <>
      <div className="py-4 flex flex-col relative">
        <div className="absolute right-0 mr-[-50%] w-[367px]">
          <img src={MarshFlyingSrc} />
        </div>
        <div className="py-10 px-[60px] flex flex-col gap-4 bg-[rgba(105,86,130,0.3)] rounded-[24px] backdrop-blur-[50px]">
          <div className="flex flex-col gap-4 justify-center items-center">
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

            <div className="cursor-pointer" onClick={onSwitchTokens}>
              <SwitchGradientIcon />
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

          {/* <RecipientAddressPanel /> */}

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
          onConfirm={handleConfirmXSwap}
          onDismiss={handleDismiss}
        />
      )}
    </>
  );
}
