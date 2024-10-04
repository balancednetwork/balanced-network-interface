import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Currency, CurrencyAmount, TradeType, XChainId, XToken } from '@balancednetwork/sdk-core';
import { Trade } from '@balancednetwork/v1-sdk';
import { Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';

import CurrencyLogoWithNetwork from '@/app/components2/CurrencyLogoWithNetwork';
import { Modal } from '@/app/components2/Modal';
import FlipIcon from '@/assets/icons/flip.svg';
import { Button } from '@/components/ui/button';
import { ApprovalState } from '@/hooks/useApproveCallback';
import { useEvmSwitchChain } from '@/hooks/useEvmSwitchChain';
import { Field } from '@/store/swap/reducer';
import { formatBigNumber } from '@/utils';
import { xChainMap } from '@/xwagmi/constants/xChains';
import useXCallFee from '@/xwagmi/xcall/hooks/useXCallFee';
import { XTransactionStatus, XTransactionType } from '@/xwagmi/xcall/types';
import { xTransactionActions } from '@/xwagmi/xcall/zustand/useXTransactionStore';
import { CheckIcon, Loader2, XIcon } from 'lucide-react';
import { ChevronRight } from 'react-feather';
import { TradeRoute } from './AdvancedSwapDetails';
import CurrencyCard from './CurrencyCard';

export enum ConfirmModalState {
  REVIEWING,
  APPROVING_TOKEN,
  PENDING_CONFIRMATION,
}

export type PendingConfirmModalState = ConfirmModalState.APPROVING_TOKEN | ConfirmModalState.PENDING_CONFIRMATION;

type XSwapModalProps = {
  open: boolean;
  currencies: { [field in Field]?: XToken };
  executionTrade?: Trade<Currency, Currency, TradeType>;
  direction: {
    from: XChainId;
    to: XChainId;
  };
  xTransactionType: XTransactionType | undefined;
  executionInputAmount: CurrencyAmount<XToken> | undefined;

  //
  confirmModalState: ConfirmModalState;
  xSwapErrorMessage: string | undefined;
  attemptingTxn: boolean;
  xTransactionId: string | undefined;
  approvalState: ApprovalState;
  pendingModalSteps: PendingConfirmModalState[];
  //
  onConfirm: () => Promise<void>;
  onDismiss: () => void;
};

const XSwapModal = ({
  open,
  currencies,
  executionTrade,
  direction,
  xTransactionType,
  executionInputAmount,
  //
  confirmModalState,
  xSwapErrorMessage,
  attemptingTxn, // TODO: remove this?
  xTransactionId,
  approvalState,
  pendingModalSteps,
  //
  onConfirm,
  onDismiss,
}: XSwapModalProps) => {
  const { formattedXCallFee } = useXCallFee(direction.from, direction.to);
  const [approved, setApproved] = useState(false);
  const [swapConfirmed, setSwapConfirmed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const currentXTransaction = xTransactionActions.get(xTransactionId || null);

  useEffect(() => {
    if (approvalState === ApprovalState.APPROVED) {
      setApproved(true);
    }
  }, [approvalState]);
  useEffect(() => {
    if (currentXTransaction) {
      // const swapConfirmed = !!txnHash || !!xTransactionId;
      if (currentXTransaction.status === XTransactionStatus.success) {
        setSwapConfirmed(true);
      }
      if (currentXTransaction.status === XTransactionStatus.failure) {
        setSwapConfirmed(true);
        setErrorMessage('Swap failed');
      }
    }
  }, [currentXTransaction]);

  const { showDetails, showProgressIndicator, showSuccess, showError } = useMemo(() => {
    let showDetails, showProgressIndicator, showSuccess, showError;
    if (xSwapErrorMessage || errorMessage) {
      showError = true;
    } else if (swapConfirmed) {
      showSuccess = true;
    } else if (confirmModalState === ConfirmModalState.REVIEWING) {
      showDetails = true;
    } else {
      showProgressIndicator = true;
    }
    return {
      showDetails,
      showProgressIndicator,
      showSuccess,
      showError,
    };
  }, [xSwapErrorMessage, swapConfirmed, confirmModalState, errorMessage]);

  const handleDismiss = useCallback(() => {
    onDismiss();
    setSwapConfirmed(false);
    setApproved(false);
    setErrorMessage(undefined);
  }, [onDismiss]);

  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(direction.from);

  const [inputAmount, outputAmount] = useMemo(
    () =>
      xTransactionType === XTransactionType.BRIDGE
        ? [executionInputAmount, executionInputAmount]
        : [executionTrade?.inputAmount, executionTrade?.outputAmount],
    [xTransactionType, executionInputAmount, executionTrade],
  );

  return (
    <Modal open={open} onDismiss={handleDismiss} title={showDetails ? 'Review Swap' : ''} hideCloseIcon={false}>
      <div className="flex flex-col gap-4">
        <div className="relative flex justify-between gap-2">
          <CurrencyCard currency={currencies[Field.INPUT]} currencyAmount={inputAmount} />
          <CurrencyCard currency={currencies[Field.OUTPUT]} currencyAmount={outputAmount} />

          {showDetails && (
            <span className="bg-[#221542] border-2 border-background absolute top-[50%] left-[50%] mx-[-24px] my-[-24px] w-[48px] h-[48px] flex justify-center items-center rounded-full">
              <ChevronRight />
            </span>
          )}
          {confirmModalState !== ConfirmModalState.REVIEWING && showProgressIndicator && (
            <span className="bg-[#221542] border-2 border-background absolute top-[50%] left-[50%] mx-[-24px] my-[-24px] w-[48px] h-[48px] flex justify-center items-center rounded-full">
              <ChevronRight />
            </span>
          )}
          {showSuccess && (
            <span className="bg-green-500 border-2 border-background absolute top-[50%] left-[50%] mx-[-24px] my-[-24px] w-[48px] h-[48px] flex justify-center items-center rounded-full">
              <CheckIcon className="text-background" />
            </span>
          )}
          {showError && (
            <span className="bg-red-500 border-2 border-background absolute top-[50%] left-[50%] mx-[-24px] my-[-24px] w-[48px] h-[48px] flex justify-center items-center rounded-full">
              <XIcon className="text-background" />
            </span>
          )}
        </div>

        {/* Details section displays rate, fees, network cost, etc. w/ additional details in drop-down menu .*/}
        {showDetails && (
          <>
            <div className="flex flex-col gap-2">
              {xTransactionType !== XTransactionType.BRIDGE && (
                <div className="flex justify-between">
                  <span className="text-secondary-foreground text-body">Rate</span>
                  <span className="text-body">
                    1 {executionTrade?.executionPrice.baseCurrency.symbol} ={' '}
                    {`${formatBigNumber(new BigNumber(executionTrade?.executionPrice.toFixed() || 0), 'ratio')} ${
                      executionTrade?.executionPrice.quoteCurrency.symbol
                    }`}
                  </span>
                </div>
              )}
              {xTransactionType !== XTransactionType.BRIDGE && (
                <div className="flex justify-between">
                  <span className="text-secondary-foreground text-body">Swap Fee</span>
                  <span className="text-body">
                    {formatBigNumber(new BigNumber(executionTrade?.fee.toFixed() || 0), 'currency')}{' '}
                    {currencies[Field.INPUT]?.symbol}
                  </span>
                </div>
              )}
              {xTransactionType !== XTransactionType.SWAP_ON_ICON && (
                <div className="flex justify-between">
                  <span className="text-secondary-foreground text-body">Bridge Fee</span>
                  <span className="text-body">{formattedXCallFee}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-secondary-foreground text-body">Network Cost</span>
                <span className="text-body">0.0001 ICX</span>
              </div>
              {xTransactionType !== XTransactionType.BRIDGE && (
                <div className="flex justify-between items-center">
                  <span className="text-secondary-foreground text-body">Order routing</span>
                  <div>
                    {executionTrade ? <TradeRoute route={executionTrade.route} currencies={currencies} /> : '-'}
                  </div>
                </div>
              )}
            </div>
            {isWrongChain ? (
              <Button color="primary" onClick={handleSwitchChain} className="h-[56px] text-base rounded-full">
                <Trans>Switch to {xChainMap[direction.from].name}</Trans>
              </Button>
            ) : (
              <Button onClick={async () => await onConfirm()} className="h-[56px] text-base rounded-full">
                <Trans>{approvalState !== ApprovalState.APPROVED ? 'Approve and Swap' : 'Swap'}</Trans>
              </Button>
            )}
          </>
        )}
        {/* Progress indicator displays all the steps of the swap flow and their current status  */}
        {confirmModalState !== ConfirmModalState.REVIEWING && showProgressIndicator && (
          <div className="flex flex-col gap-2">
            {pendingModalSteps.map(step => (
              <div key={step} className="flex gap-2 items-center justify-between">
                {step === ConfirmModalState.APPROVING_TOKEN && (
                  <>
                    <div className="flex gap-2 items-center">
                      {approvalState === ApprovalState.NOT_APPROVED && !approved && (
                        <div className="w-[40px] h-[40px] rounded-full flex items-center justify-center">
                          {currencies[Field.INPUT] && (
                            <CurrencyLogoWithNetwork currency={currencies[Field.INPUT]} size="40px" />
                          )}
                        </div>
                      )}
                      {approvalState === ApprovalState.PENDING && (
                        <div className="w-[40px] h-[40px] rounded-full flex items-center justify-center">
                          <Loader2 className="animate-spin" />
                        </div>
                      )}

                      {approved && (
                        <div className="w-[40px] h-[40px] rounded-full flex items-center justify-center">
                          {currencies[Field.INPUT] && (
                            <CurrencyLogoWithNetwork currency={currencies[Field.INPUT]} size="40px" />
                          )}
                        </div>
                      )}
                      <div>Approve {currencies[Field.INPUT]?.symbol} spending</div>
                    </div>
                    {approved && <CheckIcon />}
                  </>
                )}
                {step === ConfirmModalState.PENDING_CONFIRMATION && (
                  <>
                    <div className="flex gap-2 items-center">
                      {!xTransactionId && (
                        <div className="bg-[#4C82FB] w-[40px] h-[40px] rounded-full flex items-center justify-center">
                          <FlipIcon width={24} height={24} />
                        </div>
                      )}
                      {xTransactionId && !swapConfirmed && (
                        <div className="w-[40px] h-[40px] rounded-full flex items-center justify-center">
                          <Loader2 className="animate-spin" />
                        </div>
                      )}
                      <div>Confirm swap in wallet</div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Error message displays if there is an error in the swap flow */}
        {showError && <div className="text-red-500 text-center">{xSwapErrorMessage || errorMessage}</div>}

        {/* {!isProcessing && !gasChecker.hasEnoughGas && (
        <Flex justifyContent="center" paddingY={2}>
          <Typography maxWidth="320px" color="alert" textAlign="center">
            {gasChecker.errorMessage}
          </Typography>
        </Flex>
      )} */}
      </div>
    </Modal>
  );
};

export default XSwapModal;
