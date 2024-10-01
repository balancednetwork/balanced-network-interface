import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Currency, CurrencyAmount, TradeType, XChainId, XToken } from '@balancednetwork/sdk-core';
import { Trade } from '@balancednetwork/v1-sdk';
import { Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { Box, Flex } from 'rebass';

// import { Button, TextButton } from '@/app/components/Button';
// import { StyledButton } from '@/app/components/Button/StyledButton';
import XTransactionState from '@/app/components/XTransactionState';
import { Modal } from '@/app/components2/Modal';
import TooltipContainer from '@/app/components2/TooltipContainer';
import { Button } from '@/components/ui/button';
import { SLIPPAGE_MODAL_WARNING_THRESHOLD } from '@/constants/misc';
import { ApprovalState, useApproveCallback } from '@/hooks/useApproveCallback';
import { useSendXTransaction } from '@/hooks/useSendXTransaction';
import useXCallGasChecker from '@/hooks/useXCallGasChecker';
import { useSwapSlippageTolerance } from '@/store/application/hooks';
import { Field } from '@/store/swap/reducer';
import { formatBigNumber } from '@/utils';
import { showMessageOnBeforeUnload } from '@/utils/messages';
import { getNetworkDisplayName } from '@/utils/xTokens';
import { xChainMap } from '@/xwagmi/constants/xChains';
import useXCallFee from '@/xwagmi/xcall/hooks/useXCallFee';
import { XTransactionInput, XTransactionStatus, XTransactionType } from '@/xwagmi/xcall/types';
import { xTransactionActions } from '@/xwagmi/xcall/zustand/useXTransactionStore';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CheckIcon, XIcon } from 'lucide-react';
import { TradeRoute } from './AdvancedSwapDetails';
import CurrencyCard from './CurrencyCard';

export enum ConfirmModalState {
  REVIEWING,
  APPROVING_TOKEN,
  PENDING_CONFIRMATION,
  COMPLETED,
}

type XSwapModalProps = {
  open: boolean;
  account: string | undefined;
  currencies: { [field in Field]?: XToken };
  executionTrade?: Trade<Currency, Currency, TradeType>;
  clearInputs: () => void;
  direction: {
    from: XChainId;
    to: XChainId;
  };
  recipient?: string | null;

  //
  confirmModalState: ConfirmModalState;
  xSwapErrorMessage: string | null;
  attemptingTxn: boolean;
  txnHash: string | null;
  xTransactionId: string | null;
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
  account,
  currencies,
  executionTrade,
  direction,
  recipient,
  clearInputs,
  //
  confirmModalState,
  xSwapErrorMessage,
  attemptingTxn,
  txnHash,
  xTransactionId,
  //
  onConfirm,
  onDismiss,
}: XSwapModalProps) => {
  const [currentId, setCurrentId] = useState<string | null>(null);
  const currentXTransaction = xTransactionActions.get(currentId);
  const isProcessing: boolean = currentId !== null;
  const isExecuted =
    currentXTransaction?.status === XTransactionStatus.success ||
    currentXTransaction?.status === XTransactionStatus.failure;

  const slippageTolerance = useSwapSlippageTolerance();
  const showWarning = executionTrade?.priceImpact.greaterThan(SLIPPAGE_MODAL_WARNING_THRESHOLD);

  const { xCallFee, formattedXCallFee } = useXCallFee(direction.from, direction.to);

  const xChain = xChainMap[direction.from];

  // convert executionTrade.inputAmount in currencies[Field.INPUT]
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

  const cleanupSwap = () => {
    clearInputs();
    window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
  };

  // const handleDismiss = useCallback(() => {
  //   setOpen(false);
  //   setTimeout(() => {
  //     setCurrentId(null);
  //     setXSwapModalState(XSwapModalState.REVIEWING);
  //   }, 500);
  // }, [setOpen]);

  //to show success or fail message in the modal
  // const slowDismiss = useCallback(() => {
  //   setTimeout(() => {
  //     handleDismiss();
  //   }, 2000);
  // }, [handleDismiss]);

  // useEffect(() => {
  //   if (
  //     currentXTransaction &&
  //     (currentXTransaction.status === XTransactionStatus.success ||
  //       currentXTransaction.status === XTransactionStatus.failure)
  //   ) {
  //     slowDismiss();
  //   }
  // }, [currentXTransaction, slowDismiss]);

  const { sendXTransaction } = useSendXTransaction();

  const handleXCallSwap = async () => {
    if (!executionTrade) return;
    if (!account) return;
    if (!recipient) return;
    if (!xCallFee) return;
    if (!_inputAmount) return;

    if (approvalState !== ApprovalState.APPROVED) {
      // setXSwapModalState(XSwapModalState.APPROVING_TOKEN);
      await approveCallback();
    }

    // setXSwapModalState(XSwapModalState.PENDING_CONFIRMATION);

    const xTransactionInput: XTransactionInput = {
      type: XTransactionType.SWAP,
      direction,
      executionTrade,
      account,
      recipient,
      inputAmount: _inputAmount,
      slippageTolerance,
      xCallFee,
      callback: cleanupSwap,
    };

    try {
      const xTransactionId = await sendXTransaction(xTransactionInput);
      console.log('xTransactionId', xTransactionId);
      setCurrentId(xTransactionId || null);
    } catch (e) {
      console.log(e);
      // setXSwapModalState(XSwapModalState.REVIEWING);
    }
  };

  const gasChecker = useXCallGasChecker(direction.from);

  const modalContent = useMemo(() => {
    if (xSwapErrorMessage) {
      return (
        <div>
          <div className="relative flex justify-between gap-2">
            <CurrencyCard currency={currencies[Field.INPUT]} currencyAmount={executionTrade?.inputAmount} />
            <CurrencyCard currency={currencies[Field.OUTPUT]} currencyAmount={executionTrade?.outputAmount} />

            <span className="absolute top-[50%] left-[50%] mx-[-15px] my-[-15px] w-[30px] h-[30px] flex justify-center items-center border-2 rounded-full">
              <XIcon />
            </span>
          </div>
          <span className="text-red-500">{xSwapErrorMessage}</span>
        </div>
      );
    }

    return <></>;
  }, [xSwapErrorMessage, currencies, executionTrade]);

  return (
    <Modal open={open} onDismiss={onDismiss} title="Review Swap">
      {modalContent}
      <div className="relative flex justify-between gap-2">
        <CurrencyCard currency={currencies[Field.INPUT]} currencyAmount={executionTrade?.inputAmount} />
        <CurrencyCard currency={currencies[Field.OUTPUT]} currencyAmount={executionTrade?.outputAmount} />

        {confirmModalState === ConfirmModalState.COMPLETED ? (
          <span className="absolute top-[50%] left-[50%] mx-[-15px] my-[-15px] w-[30px] h-[30px] flex justify-center items-center border-2 rounded-full">
            <CheckIcon />
          </span>
        ) : (
          <span className="absolute top-[50%] left-[50%] mx-[-15px] my-[-15px] w-[30px] h-[30px] flex justify-center items-center border-2 rounded-full">
            <ArrowRight />
          </span>
        )}
      </div>

      {confirmModalState === ConfirmModalState.REVIEWING && (
        <>
          <Button onClick={() => onConfirm()}>
            <Trans>{approvalState !== ApprovalState.APPROVED ? 'Approve and Swap' : 'Swap'}</Trans>
          </Button>

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
        </>
      )}

      {confirmModalState === ConfirmModalState.APPROVING_TOKEN && (
        <div>
          <div>Approve USDC spending</div>
          <div>Confirm swap in wallet</div>
        </div>
      )}
      {confirmModalState === ConfirmModalState.PENDING_CONFIRMATION && <div>Confirm swap in wallet</div>}

      {/* {currentXTransaction && <XTransactionState xTransaction={currentXTransaction} />} */}

      {/* <AnimatePresence>
        {((!isExecuted && isProcessing) || !isProcessing) && (
          <motion.div
            key={'tx-actions'}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <Flex justifyContent="center" mt={4} pt={4} className="border-top">
              <TextButton onClick={handleDismiss}>
                <Trans>{isProcessing ? 'Close' : 'Cancel'}</Trans>
              </TextButton>

              {isProcessing ? (
                <>
                  <StyledButton disabled $loading>
                    <Trans>Swapping</Trans>
                  </StyledButton>
                </>
              ) : (
                <>
                  {approvalState !== ApprovalState.APPROVED ? (
                    <Button onClick={approveCallback} disabled={approvalState === ApprovalState.PENDING}>
                      {approvalState === ApprovalState.PENDING ? 'Approving' : 'Approve transfer'}
                    </Button>
                  ) : (
                    <StyledButton onClick={handleXCallSwap} disabled={!gasChecker.hasEnoughGas}>
                      <Trans>Swap</Trans>
                    </StyledButton>
                  )}
                </>
              )}
            </Flex>
          </motion.div>
        )}
      </AnimatePresence> */}

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
