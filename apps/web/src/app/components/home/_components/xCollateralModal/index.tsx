import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { Trans, t } from '@lingui/macro';
import { Box, Flex } from 'rebass';

import { Button, TextButton } from '@/app/components/Button';
import { StyledButton } from '@/app/components/Button/StyledButton';
import Modal from '@/app/components/Modal';
import ModalContent from '@/app/components/ModalContent';
import XTransactionState from '@/app/components/XTransactionState';
import { Typography } from '@/app/theme';
import { useAnalytics } from '@/hooks/useAnalytics';
import { ApprovalState, useApproveCallback } from '@/hooks/useApproveCallback';
import { useEvmSwitchChain } from '@/hooks/useEvmSwitchChain';
import { MODAL_ID, modalActions, useModalOpen } from '@/hooks/useModalStore';
import { useWalletPrompting } from '@/hooks/useWalletPrompting';
import useXCallGasChecker from '@/hooks/useXCallGasChecker';
import { useCollateralActionHandlers, useDerivedCollateralInfo } from '@/store/collateral/hooks';
import { formatSymbol, useWrongSymbol } from '@/utils/formatter';
import { useSendXTransaction, xChainMap } from '@balancednetwork/xwagmi';
import { XChainId, XToken } from '@balancednetwork/xwagmi';
import { useXCallFee } from '@balancednetwork/xwagmi';
import { XTransactionInput, XTransactionStatus, XTransactionType } from '@balancednetwork/xwagmi';
import { xTransactionActions } from '@balancednetwork/xwagmi';
import { AnimatePresence, motion } from 'framer-motion';
import useLoanWalletServiceHandler from '../../useLoanWalletServiceHandler';

export enum XCollateralAction {
  DEPOSIT = 'DEPOSIT',
  WITHDRAW = 'WITHDRAW',
}

type XCollateralModalProps = {
  modalId?: MODAL_ID;
  account: string | undefined;
  sourceChain: XChainId;
  storedModalValues: {
    amount: string;
    before: string;
    after: string;
    action: XCollateralAction;
  };
  currencyAmount?: CurrencyAmount<XToken>;
};

const XCollateralModal = ({
  modalId = MODAL_ID.XCOLLATERAL_CONFIRM_MODAL,
  account,
  currencyAmount,
  sourceChain,
  storedModalValues,
}: XCollateralModalProps) => {
  const modalOpen = useModalOpen(modalId);
  const { track } = useAnalytics();
  const { collateralType } = useDerivedCollateralInfo();
  const { isWalletPrompting, setWalletPrompting } = useWalletPrompting();
  const [currentId, setCurrentId] = useState<string | null>(null);
  const currentXTransaction = xTransactionActions.get(currentId);
  const isProcessing: boolean = currentId !== null;
  const { onAdjust: adjust } = useCollateralActionHandlers();
  const isExecuted =
    currentXTransaction?.status === XTransactionStatus.success ||
    currentXTransaction?.status === XTransactionStatus.failure;

  const { xCallFee, formattedXCallFee } = useXCallFee(sourceChain, '0x1.icon');

  const xChain = xChainMap[sourceChain];
  const _inputAmount = useMemo(() => {
    return currencyAmount ? currencyAmount : undefined;
  }, [currencyAmount]);
  const { approvalState, approveCallback } = useApproveCallback(_inputAmount, xChain.contracts.assetManager);

  const cancelAdjusting = React.useCallback(() => {
    adjust(false);
  }, [adjust]);

  const handleDismiss = useCallback(() => {
    modalActions.closeModal(modalId);
    setWalletPrompting(false);
    setTimeout(() => {
      setCurrentId(null);
    }, 500);
  }, [modalId, setWalletPrompting]);

  //to show success or fail message in the modal
  const slowDismiss = useCallback(() => {
    setTimeout(() => {
      handleDismiss();
    }, 2000);
  }, [handleDismiss]);

  useEffect(() => {
    if (
      currentXTransaction &&
      (currentXTransaction.status === XTransactionStatus.success ||
        currentXTransaction.status === XTransactionStatus.failure)
    ) {
      slowDismiss();
    }
  }, [currentXTransaction, slowDismiss]);

  const sendXTransaction = useSendXTransaction();
  const handleXCollateralAction = async () => {
    if (!account) return;
    if (!xCallFee) return;
    if (!_inputAmount) return;

    const type =
      storedModalValues.action === XCollateralAction.DEPOSIT ? XTransactionType.DEPOSIT : XTransactionType.WITHDRAW;

    const direction = {
      from: sourceChain,
      to: storedModalValues.action === XCollateralAction.DEPOSIT ? ('0x1.icon' as XChainId) : sourceChain,
    };

    const xTransactionInput: XTransactionInput = {
      type,
      direction,
      account,
      inputAmount: _inputAmount,
      xCallFee,
      usedCollateral: useWrongSymbol(collateralType),
    };

    setWalletPrompting(true);
    const xTransactionId = await sendXTransaction(xTransactionInput);
    cancelAdjusting();
    setCurrentId(xTransactionId || null);

    track(storedModalValues.action === XCollateralAction.DEPOSIT ? 'collateral_deposit' : 'collateral_withdrawal', {
      from: xChainMap[sourceChain].name,
    });
  };

  const gasChecker = useXCallGasChecker(
    sourceChain,
    storedModalValues.action === XCollateralAction.DEPOSIT ? _inputAmount : undefined,
  );

  useLoanWalletServiceHandler();
  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(sourceChain);

  return (
    <>
      <Modal isOpen={modalOpen} onDismiss={handleDismiss}>
        <ModalContent noMessages={isProcessing} noCurrencyBalanceErrorMessage>
          <Typography textAlign="center" mb="5px">
            {storedModalValues.action === XCollateralAction.DEPOSIT
              ? t`Deposit ${formatSymbol(_inputAmount?.currency.symbol)} collateral?`
              : t`Withdraw ${formatSymbol(_inputAmount?.currency.symbol)} collateral?`}
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
            {storedModalValues.amount}
          </Typography>

          <Flex my={4}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">
                <Trans>Before</Trans>
              </Typography>
              <Typography variant="p" textAlign="center">
                {storedModalValues.before}
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">
                <Trans>After</Trans>
              </Typography>
              <Typography variant="p" textAlign="center">
                {storedModalValues.after}
              </Typography>
            </Box>
          </Flex>

          <Typography textAlign="center">
            <Trans>
              Transfer fee: <strong>{formattedXCallFee}</strong>
            </Trans>
          </Typography>

          {currentXTransaction && <XTransactionState xTransaction={currentXTransaction} />}

          <AnimatePresence>
            {((!isExecuted && isProcessing) || !isProcessing) && (
              <motion.div
                key={'tx-actions'}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <Flex justifyContent="center" mt="20px" pt="20px" className="border-top">
                  <>
                    <TextButton onClick={handleDismiss}>
                      {isProcessing ? <Trans>Close</Trans> : <Trans>Cancel</Trans>}
                    </TextButton>

                    {isWrongChain ? (
                      <StyledButton onClick={handleSwitchChain}>
                        <Trans>Switch to</Trans>
                        {` ${xChainMap[sourceChain].name}`}
                      </StyledButton>
                    ) : isProcessing ? (
                      <>
                        <StyledButton disabled $loading>
                          {storedModalValues.action === XCollateralAction.DEPOSIT ? (
                            <Trans>Depositing</Trans>
                          ) : (
                            <Trans>Withdrawing</Trans>
                          )}
                        </StyledButton>
                      </>
                    ) : (
                      <>
                        {approvalState !== ApprovalState.APPROVED ? (
                          <Button onClick={approveCallback} disabled={approvalState === ApprovalState.PENDING}>
                            {approvalState === ApprovalState.PENDING ? (
                              <Trans>Approving</Trans>
                            ) : (
                              <Trans>Approve transfer</Trans>
                            )}
                          </Button>
                        ) : (
                          <StyledButton
                            onClick={handleXCollateralAction}
                            disabled={!gasChecker.hasEnoughGas || isWalletPrompting}
                          >
                            {isWalletPrompting ? (
                              <Trans>Waiting for wallet...</Trans>
                            ) : storedModalValues.action === XCollateralAction.DEPOSIT ? (
                              <Trans>Deposit</Trans>
                            ) : (
                              <Trans>Withdraw</Trans>
                            )}
                          </StyledButton>
                        )}
                      </>
                    )}
                  </>
                </Flex>
              </motion.div>
            )}
          </AnimatePresence>

          {!isProcessing && !gasChecker.hasEnoughGas && (
            <Flex justifyContent="center" paddingY={2}>
              <Typography maxWidth="320px" color="alert" textAlign="center">
                {gasChecker.errorMessage}
              </Typography>
            </Flex>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default XCollateralModal;
