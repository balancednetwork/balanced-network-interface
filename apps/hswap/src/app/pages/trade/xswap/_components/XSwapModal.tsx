import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';

import { WhiteButton } from '@/app/components2/Button';
import CurrencyLogoWithNetwork from '@/app/components2/CurrencyLogoWithNetwork';
import { ArrowGradientIcon, TimeGradientIcon } from '@/app/components2/Icons';
import { Modal } from '@/app/components2/Modal';
import { ApprovalState } from '@/hooks/useApproveCallback';
import { useEvmSwitchChain } from '@/hooks/useEvmSwitchChain';
import { Field } from '@/store/swap/reducer';
import { formatBigNumber } from '@/utils';
import { xChainMap } from '@balancednetwork/xwagmi';
import { XToken } from '@balancednetwork/xwagmi';
import useXCallFee from '@balancednetwork/xwagmi';
import { XTransactionInput, XTransactionStatus, XTransactionType } from '@balancednetwork/xwagmi';
import { xTransactionActions } from '@balancednetwork/xwagmi';
import { CheckIcon, Loader2 } from 'lucide-react';
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
  executionXTransactionInput: XTransactionInput;

  //
  confirmModalState: ConfirmModalState;
  xSwapErrorMessage: string | undefined;
  attemptingTxn: boolean;
  xTransactionId: string | undefined;
  approvalState: ApprovalState;
  pendingModalSteps: PendingConfirmModalState[];
  //
  onApprove: () => Promise<void>;
  onConfirm: () => Promise<void>;
  onDismiss: () => void;
};

const XSwapModal = ({
  open,
  currencies,
  executionXTransactionInput,
  //
  confirmModalState,
  xSwapErrorMessage,
  attemptingTxn, // TODO: remove this?
  xTransactionId,
  approvalState,
  pendingModalSteps,
  //
  onApprove,
  onConfirm,
  onDismiss,
}: XSwapModalProps) => {
  const {
    executionTrade,
    direction,
    inputAmount: executionInputAmount,
    type: xTransactionType,
  } = executionXTransactionInput;

  const { formattedXCallFee } = useXCallFee(direction.from, direction.to);
  const [swapConfirmed, setSwapConfirmed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const currentXTransaction = xTransactionActions.get(xTransactionId || null);

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
    <Modal
      open={open}
      onDismiss={handleDismiss}
      title={''}
      className="bg-[#D4C5F9]/30 backdrop-blur-[50px] border-none px-10"
      dialogClassName="max-w-[350px] h-[625px] pt-[120px]"
    >
      <div className="flex flex-col gap-8">
        <div className="relative flex justify-center gap-2">
          <CurrencyCard currency={currencies[Field.INPUT]} currencyAmount={inputAmount} />
          <CurrencyCard currency={currencies[Field.OUTPUT]} currencyAmount={outputAmount} />
          <div className="bg-title-gradient absolute top-[50%] left-[50%] mx-[-16px] my-[-32px] w-8 h-8 p-1 rounded-full">
            <div className="bg-white flex justify-center items-center rounded-full w-full h-full">
              <ArrowGradientIcon />
            </div>
          </div>
        </div>

        {/* Details section displays rate, fees, network cost, etc. w/ additional details in drop-down menu .*/}
        {showDetails && (
          <>
            <div className="flex flex-col gap-2">
              {xTransactionType !== XTransactionType.BRIDGE && (
                <div className="flex justify-between">
                  <span className="text-[#d4c5f9] text-sm font-medium">Rate</span>
                  <span className="text-white text-sm">
                    1 {executionTrade?.executionPrice.baseCurrency.symbol} ={' '}
                    {`${formatBigNumber(new BigNumber(executionTrade?.executionPrice.toFixed() || 0), 'ratio')} ${
                      executionTrade?.executionPrice.quoteCurrency.symbol
                    }`}
                  </span>
                </div>
              )}
              {xTransactionType !== XTransactionType.BRIDGE && (
                <div className="flex justify-between">
                  <span className="text-[#d4c5f9] text-sm font-medium">Swap Fee</span>
                  <span className="text-white text-sm">
                    {formatBigNumber(new BigNumber(executionTrade?.fee.toFixed() || 0), 'currency')}{' '}
                    {currencies[Field.INPUT]?.symbol}
                  </span>
                </div>
              )}
              {xTransactionType !== XTransactionType.SWAP_ON_ICON && (
                <div className="flex justify-between">
                  <span className="text-[#d4c5f9] text-sm font-medium">Bridge Fee</span>
                  <span className="text-white text-sm">{formattedXCallFee}</span>
                </div>
              )}
              {/* <div className="flex justify-between">
                <span className="text-[#d4c5f9] text-sm font-medium">Network Cost</span>
                <span className="text-white text-sm">0.0001 ICX</span>
              </div> */}
              {/* {xTransactionType !== XTransactionType.BRIDGE && (
                <div className="flex justify-between items-center">
                  <span className="text-secondary-foreground text-body">Order routing</span>
                  <div>
                    {executionTrade ? <TradeRoute route={executionTrade.route} currencies={currencies} /> : '-'}
                  </div>
                </div>
              )} */}
            </div>
            {isWrongChain ? (
              <WhiteButton onClick={handleSwitchChain} className="h-[48px] text-base rounded-full">
                <Trans>Switch to {xChainMap[direction.from].name}</Trans>
                <ArrowGradientIcon />
              </WhiteButton>
            ) : approvalState !== ApprovalState.APPROVED ? (
              <WhiteButton onClick={async () => await onApprove()} className="h-[48px] text-base rounded-full">
                <Trans>Approve</Trans>
                <ArrowGradientIcon />
              </WhiteButton>
            ) : (
              <WhiteButton onClick={async () => await onConfirm()} className="h-[48px] text-base rounded-full">
                <Trans>Swap</Trans>
                <ArrowGradientIcon />
              </WhiteButton>
            )}
          </>
        )}

        {/* Progress indicator displays all the steps of the swap flow and their current status  */}
        {confirmModalState !== ConfirmModalState.REVIEWING && showProgressIndicator && (
          <div className="flex flex-col gap-2 items-center">
            {pendingModalSteps.map(step => (
              <div key={step} className="flex gap-2 items-center justify-between">
                {step === ConfirmModalState.APPROVING_TOKEN && (
                  <>
                    <div className="flex flex-col gap-2 items-center items-center">
                      {approvalState === ApprovalState.NOT_APPROVED && (
                        <div className="w-[40px] h-[40px] rounded-full flex items-center justify-center">
                          {currencies[Field.INPUT] && <CurrencyLogoWithNetwork currency={currencies[Field.INPUT]} />}
                        </div>
                      )}
                      {approvalState === ApprovalState.PENDING && (
                        <div className="w-[40px] h-[40px] rounded-full flex items-center justify-center">
                          <Loader2 className="animate-spin" />
                        </div>
                      )}

                      <div className="text-[#e6e0f7] text-sm font-bold">
                        Approve {currencies[Field.INPUT]?.symbol} in wallet
                      </div>
                    </div>
                  </>
                )}
                {step === ConfirmModalState.PENDING_CONFIRMATION && (
                  <>
                    <div className="flex flex-col gap-2 justify-center items-center">
                      {!xTransactionId && (
                        <div className="bg-[#e6e0f7] w-[40px] h-[40px] rounded-full flex items-center justify-center">
                          <TimeGradientIcon />
                        </div>
                      )}
                      {xTransactionId && !swapConfirmed && (
                        <div className="w-[40px] h-[40px] rounded-full flex items-center justify-center">
                          <Loader2 className="animate-spin" />
                        </div>
                      )}
                      <div className="text-[#e6e0f7] text-sm font-bold">Confirm swap in wallet</div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {showSuccess && (
          <div className="flex flex-col gap-2 justify-center items-center">
            <div className="bg-[#e6e0f7] w-[40px] h-[40px] rounded-full flex items-center justify-center">
              <div className="bg-title-gradient rounded-full w-4 h-4 flex justify-center items-center">
                <CheckIcon className="w-2 h-2" />
              </div>
            </div>
            <div className=" text-[#e6e0f7] text-sm font-bold">Swap completed!</div>
          </div>
        )}

        {/* Error message displays if there is an error in the swap flow */}
        {showError && <div className="text-red-500 text-center">{xSwapErrorMessage || errorMessage}</div>}
      </div>
    </Modal>
  );
};

export default XSwapModal;
