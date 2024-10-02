import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Currency, TradeType, XChainId, XToken } from '@balancednetwork/sdk-core';
import { Trade } from '@balancednetwork/v1-sdk';
import { Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';

import { Modal } from '@/app/components2/Modal';
import TooltipContainer from '@/app/components2/TooltipContainer';
import { Button } from '@/components/ui/button';
import { ApprovalState } from '@/hooks/useApproveCallback';
import { Field } from '@/store/swap/reducer';
import { formatBigNumber } from '@/utils';
import useXCallFee from '@/xwagmi/xcall/hooks/useXCallFee';
import { ArrowRight, CheckIcon, Loader2, XIcon } from 'lucide-react';
import { TradeRoute } from './AdvancedSwapDetails';
import CurrencyCard from './CurrencyCard';
import { xTransactionActions } from '@/xwagmi/xcall/zustand/useXTransactionStore';
import { XTransactionStatus } from '@/xwagmi/xcall/types';

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

export const presenceVariants = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 },
};

const XSwapModal = ({
  open,
  currencies,
  executionTrade,
  direction,
  //
  confirmModalState,
  xSwapErrorMessage,
  attemptingTxn,
  xTransactionId,
  approvalState,
  pendingModalSteps,
  //
  onConfirm,
  onDismiss,
}: XSwapModalProps) => {
  const { formattedXCallFee } = useXCallFee(direction.from, direction.to);

  const [swapConfirmed, setSwapConfirmed] = useState(false);
  const currentXTransaction = xTransactionActions.get(xTransactionId || null);

  useEffect(() => {
    if (
      currentXTransaction &&
      (currentXTransaction.status === XTransactionStatus.success ||
        currentXTransaction.status === XTransactionStatus.failure)
    ) {
      // const swapConfirmed = !!txnHash || !!xTransactionId;
      setSwapConfirmed(true);
    }
  }, [currentXTransaction]);

  const { showDetails, showProgressIndicator, showSuccess, showError } = useMemo(() => {
    let showDetails, showProgressIndicator, showSuccess, showError;
    if (xSwapErrorMessage) {
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
  }, [xSwapErrorMessage, swapConfirmed, confirmModalState]);

  const handleDismiss = useCallback(() => {
    onDismiss();
    setSwapConfirmed(false);
  }, [onDismiss]);

  return (
    <Modal open={open} onDismiss={handleDismiss} title={showDetails ? 'Review Swap' : ''}>
      <div className="relative flex justify-between gap-2">
        <CurrencyCard currency={currencies[Field.INPUT]} currencyAmount={executionTrade?.inputAmount} />
        <CurrencyCard currency={currencies[Field.OUTPUT]} currencyAmount={executionTrade?.outputAmount} />
        {showDetails && (
          <span className="absolute top-[50%] left-[50%] mx-[-15px] my-[-15px] w-[30px] h-[30px] flex justify-center items-center rounded-full">
            <ArrowRight />
          </span>
        )}
        {confirmModalState !== ConfirmModalState.REVIEWING && showProgressIndicator && (
          <span className="absolute top-[50%] left-[50%] mx-[-15px] my-[-15px] w-[30px] h-[30px] flex justify-center items-center rounded-full">
            <Loader2 className="animate-spin" />
          </span>
        )}
        {showSuccess && (
          <span className="absolute top-[50%] left-[50%] mx-[-15px] my-[-15px] w-[30px] h-[30px] flex justify-center items-center rounded-full">
            <CheckIcon />
          </span>
        )}
        {showError && (
          <span className="absolute top-[50%] left-[50%] mx-[-15px] my-[-15px] w-[30px] h-[30px] flex justify-center items-center rounded-full">
            <XIcon />
          </span>
        )}
      </div>

      {/* Details section displays rate, fees, network cost, etc. w/ additional details in drop-down menu .*/}
      {showDetails && (
        <>
          <div className="flex flex-col gap-2">
            <TooltipContainer tooltipText="The impact your trade has on the market price of this pool.">
              <div className="flex justify-between">
                <span className="text-secondary-foreground">Rate</span>
                <span>
                  1 {executionTrade?.executionPrice.baseCurrency.symbol} ={' '}
                  {`${formatBigNumber(new BigNumber(executionTrade?.executionPrice.toFixed() || 0), 'ratio')} ${
                    executionTrade?.executionPrice.quoteCurrency.symbol
                  }`}
                </span>
              </div>
            </TooltipContainer>
            <div className="flex justify-between">
              <span className="text-secondary-foreground">Swap Fee</span>
              <span>
                {formatBigNumber(new BigNumber(executionTrade?.fee.toFixed() || 0), 'currency')}{' '}
                {currencies[Field.INPUT]?.symbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary-foreground">Bridge Fee</span>
              <span>{formattedXCallFee}</span>
            </div>
            {/* <div className="flex justify-between">
          <span className="text-secondary-foreground">Network Cost</span>
          <span>0.0001 ICX</span>
        </div> */}
            <div className="flex justify-between">
              <span className="text-secondary-foreground">Route</span>
              <div>{executionTrade ? <TradeRoute route={executionTrade.route} currencies={currencies} /> : '-'}</div>
            </div>
          </div>

          <Button onClick={async () => await onConfirm()}>
            <Trans>{approvalState !== ApprovalState.APPROVED ? 'Approve and Swap' : 'Swap'}</Trans>
          </Button>
        </>
      )}
      {/* Progress indicator displays all the steps of the swap flow and their current status  */}
      {confirmModalState !== ConfirmModalState.REVIEWING && showProgressIndicator && (
        <div>
          {pendingModalSteps.map(step => (
            <div key={step} className="flex items-center gap-2">
              {step === ConfirmModalState.APPROVING_TOKEN && (
                <div>Approve USDC spending - {approvalState === ApprovalState.APPROVED ? 'Approved' : ''}</div>
              )}
              {step === ConfirmModalState.PENDING_CONFIRMATION && <div>Confirm swap in wallet</div>}
            </div>
          ))}
        </div>
      )}

      {/* Error message displays if there is an error in the swap flow */}
      {showError && <div className="text-red-500">{xSwapErrorMessage}</div>}

      {/* {!isProcessing && !gasChecker.hasEnoughGas && (
        <Flex justifyContent="center" paddingY={2}>
          <Typography maxWidth="320px" color="alert" textAlign="center">
            {gasChecker.errorMessage}
          </Typography>
        </Flex>
      )} */}
    </Modal>
  );
};

export default XSwapModal;
