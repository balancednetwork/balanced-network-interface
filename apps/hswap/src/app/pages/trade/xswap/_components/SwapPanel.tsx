import React, { useCallback, useMemo, useState } from 'react';

import { Currency, CurrencyAmount, Percent, TradeType, XToken } from '@balancednetwork/sdk-core';
import { Trade } from '@balancednetwork/v1-sdk';
import { Trans, t } from '@lingui/macro';
import BigNumber from 'bignumber.js';

import { UnderlineText } from '@/app/components/DropdownText';
import CurrencyInputPanel, { CurrencyInputPanelType } from '@/app/components2/CurrencyInputPanel';
import { Typography } from '@/app/theme';
import FlipIcon from '@/assets/icons/flip.svg';
import { Button } from '@/components/ui/button';
import { useEvmSwitchChain } from '@/hooks/useEvmSwitchChain';
import { useSignedInWallets } from '@/hooks/useWallets';
import { useSwapSlippageTolerance, useWalletModalToggle } from '@/store/application/hooks';
import { useDerivedSwapInfo, useInitialSwapLoad, useSwapActionHandlers, useSwapState } from '@/store/swap/hooks';
import { Field } from '@/store/swap/reducer';
import { maxAmountSpend } from '@/utils';
import { getXChainType } from '@/xwagmi/actions';
import { xChainMap } from '@/xwagmi/constants/xChains';
import { useXAccount } from '@/xwagmi/hooks';
import AdvancedSwapDetails from './AdvancedSwapDetails';
import RecipientAddressPanel from './RecipientAddressPanel';
import SwapModal from './SwapModal';
import XSwapModal, { ConfirmModalState, PendingConfirmModalState } from './XSwapModal';
import useXCallFee from '@/xwagmi/xcall/hooks/useXCallFee';
import { XTransactionInput, XTransactionType } from '@/xwagmi/xcall/types';
import { useSendXTransaction } from '@/hooks/useSendXTransaction';
import { ApprovalState, useApproveCallback } from '@/hooks/useApproveCallback';
import { showMessageOnBeforeUnload } from '@/utils/messages';

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
  const [open, setOpen] = React.useState(false);

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

  const signedInWallets = useSignedInWallets();
  const { recipient } = useSwapState();

  const { onUserInput, onCurrencySelection, onSwitchTokens, onPercentSelection, onChangeRecipient, onChainSelection } =
    useSwapActionHandlers();

  const [xSwapModalState, setXSwapModalState] = React.useState<XSwapModalState>(DEFAULT_XSWAP_MODAL_STATE);

  const xAccount = useXAccount(getXChainType(direction.to));

  React.useEffect(() => {
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

  const maxInputAmount = React.useMemo(
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
        setOpen(true);
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

  const handleMaximumBridgeAmountClick = () => {
    if (maximumBridgeAmount) {
      onUserInput(Field.OUTPUT, maximumBridgeAmount?.toFixed(4));
    }
  };

  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(direction.from);

  const swapButton = useMemo(() => {
    if (isValid && isWrongChain) {
      return (
        <Button color="primary" onClick={handleSwitchChain} className="w-full rounded-3xl">
          <Trans>Switch to {xChainMap[direction.from].name}</Trans>
        </Button>
      );
    }

    return isValid ? (
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
  }, [isValid, account, inputError, canBridge, handleSwap, isWrongChain, handleSwitchChain, direction.from]);

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
    return executionTrade?.inputAmount && currencies[Field.INPUT]
      ? CurrencyAmount.fromRawAmount(
          XToken.getXToken(direction.from, currencies[Field.INPUT].wrapped),
          new BigNumber(executionTrade.inputAmount.toFixed())
            .times((10n ** BigInt(currencies[Field.INPUT].decimals)).toString())
            .toFixed(0),
        )
      : undefined;
  }, [executionTrade, direction.from, currencies]);
  const { approvalState, approveCallback } = useApproveCallback(_inputAmount, xChain.contracts.assetManager);

  const { xCallFee, formattedXCallFee } = useXCallFee(direction.from, direction.to);
  const slippageTolerance = useSwapSlippageTolerance();
  const { sendXTransaction } = useSendXTransaction();

  const cleanupSwap = useCallback(() => {
    clearSwapInputOutput();
    window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
  }, [clearSwapInputOutput]);

  const handleConfirmXSwap = async () => {
    if (!executionTrade) return;
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
      type: XTransactionType.SWAP,
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
  };
  // [
  //   sendXTransaction,
  //   executionTrade,
  //   account,
  //   recipient,
  //   _inputAmount,
  //   direction,
  //   xCallFee,
  //   approvalState,
  //   approveCallback,
  //   cleanupSwap,
  //   xSwapModalState,
  // slippageTolerance
  // ];

  return (
    <>
      <div className="px-3 py-7 flex flex-col">
        <div className="flex flex-col gap-4 items-stretch">
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

          <div className="flex items-center justify-center">
            <div className="cursor-pointer" onClick={onSwitchTokens}>
              <FlipIcon width={25} height={17} />
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

          <RecipientAddressPanel />

          <div className="flex justify-center">{swapButton}</div>
          <AdvancedSwapDetails />

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
