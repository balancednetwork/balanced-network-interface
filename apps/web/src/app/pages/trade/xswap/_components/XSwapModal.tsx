import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Currency, CurrencyAmount, TradeType } from '@balancednetwork/sdk-core';
import { Trade } from '@balancednetwork/v1-sdk';
import { Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { Box, Flex } from 'rebass';

import { Button, TextButton } from '@/app/components/Button';
import { StyledButton } from '@/app/components/Button/StyledButton';
import Modal from '@/app/components/Modal';
import ModalContent from '@/app/components/ModalContent';
import XTransactionState from '@/app/components/XTransactionState';
import { Typography } from '@/app/theme';
import { PRICE_IMPACT_MODAL_WARNING_THRESHOLD } from '@/constants/misc';
import { ApprovalState, useApproveCallback } from '@/hooks/useApproveCallback';
import { useEvmSwitchChain } from '@/hooks/useEvmSwitchChain';
import { MODAL_ID, modalActions, useModalOpen } from '@/hooks/useModalStore';
import { useSendXTransaction } from '@/hooks/useSendXTransaction';
import useXCallGasChecker from '@/hooks/useXCallGasChecker';
import { useSwapSlippageTolerance } from '@/store/application/hooks';
import { Field } from '@/store/swap/reducer';
import { formatBigNumber, shortenAddress } from '@/utils';
import { formatSymbol } from '@/utils/formatter';
import { showMessageOnBeforeUnload } from '@/utils/messages';
import { getNetworkDisplayName } from '@/utils/xTokens';
import { xChainMap } from '@balancednetwork/xwagmi';
import { XChainId, XToken } from '@balancednetwork/xwagmi';
import { useXCallFee } from '@balancednetwork/xwagmi';
import { XTransactionInput, XTransactionStatus, XTransactionType } from '@balancednetwork/xwagmi';
import { xTransactionActions } from '@balancednetwork/xwagmi';
import { AnimatePresence, motion } from 'framer-motion';

type XSwapModalProps = {
  modalId?: MODAL_ID;
  account: string | undefined;
  currencies: { [field in Field]?: Currency };
  executionTrade?: Trade<Currency, Currency, TradeType>;
  clearInputs: () => void;
  direction: {
    from: XChainId;
    to: XChainId;
  };
  recipient?: string | null;
};

const XSwapModal = ({
  modalId = MODAL_ID.XSWAP_CONFIRM_MODAL,
  account,
  currencies,
  executionTrade,
  direction,
  recipient,
  clearInputs,
}: XSwapModalProps) => {
  const modalOpen = useModalOpen(modalId);

  const [currentId, setCurrentId] = useState<string | null>(null);
  const currentXTransaction = xTransactionActions.get(currentId);
  const isProcessing: boolean = currentId !== null;
  const isExecuted =
    currentXTransaction?.status === XTransactionStatus.success ||
    currentXTransaction?.status === XTransactionStatus.failure;

  const slippageTolerance = useSwapSlippageTolerance();
  const showWarning = executionTrade?.priceImpact.greaterThan(PRICE_IMPACT_MODAL_WARNING_THRESHOLD);

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

  const handleDismiss = useCallback(() => {
    modalActions.closeModal(modalId);
    setTimeout(() => {
      setCurrentId(null);
    }, 500);
  }, [modalId]);

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

  const { sendXTransaction } = useSendXTransaction();
  const handleXCallSwap = async () => {
    if (!executionTrade) return;
    if (!account) return;
    if (!recipient) return;
    if (!xCallFee) return;
    if (!_inputAmount) return;

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

    const xTransactionId = await sendXTransaction(xTransactionInput);
    setCurrentId(xTransactionId || null);
  };

  const gasChecker = useXCallGasChecker(direction.from, _inputAmount);

  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(direction.from);

  return (
    <>
      <Modal isOpen={modalOpen} onDismiss={handleDismiss}>
        <ModalContent noMessages={isProcessing} noCurrencyBalanceErrorMessage>
          <Typography textAlign="center" mb="5px" as="h3" fontWeight="normal">
            <Trans>
              Swap {formatSymbol(currencies[Field.INPUT]?.symbol)} for {formatSymbol(currencies[Field.OUTPUT]?.symbol)}?
            </Trans>
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" color={showWarning ? 'alert' : 'text'}>
            <Trans>
              {`${formatBigNumber(new BigNumber(executionTrade?.executionPrice.toFixed() || 0), 'ratio')} ${formatSymbol(
                executionTrade?.executionPrice.quoteCurrency.symbol,
              )} 
              per ${formatSymbol(executionTrade?.executionPrice.baseCurrency.symbol)}`}
            </Trans>
          </Typography>

          <Flex my={4}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">
                <Trans>Pay</Trans>
              </Typography>
              <Typography variant="p" textAlign="center" py="5px">
                {formatBigNumber(new BigNumber(executionTrade?.inputAmount.toFixed() || 0), 'currency')}{' '}
                {formatSymbol(currencies[Field.INPUT]?.symbol)}
              </Typography>
              <Typography textAlign="center">
                <Trans>{getNetworkDisplayName(direction.from)}</Trans>
              </Typography>
              <Typography textAlign="center">
                <Trans>{recipient && account && shortenAddress(account, 5)}</Trans>
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">
                <Trans>Receive</Trans>
              </Typography>
              <Typography variant="p" textAlign="center" py="5px">
                {formatBigNumber(new BigNumber(executionTrade?.outputAmount.toFixed() || 0), 'currency')}{' '}
                {formatSymbol(currencies[Field.OUTPUT]?.symbol)}
              </Typography>
              <Typography textAlign="center">
                <Trans>{getNetworkDisplayName(direction.to)}</Trans>
              </Typography>
              <Typography textAlign="center">
                <Trans>{recipient && shortenAddress(recipient, 5)}</Trans>
              </Typography>
            </Box>
          </Flex>

          <Typography
            textAlign="center"
            hidden={currencies[Field.INPUT]?.symbol === 'ICX' && currencies[Field.OUTPUT]?.symbol === 'sICX'}
          >
            <Trans>Swap fee (included):</Trans>{' '}
            <strong>
              {formatBigNumber(new BigNumber(executionTrade?.fee.toFixed() || 0), 'currency')}{' '}
              {currencies[Field.INPUT]?.symbol}
            </strong>
          </Typography>

          <Typography textAlign="center">
            <Trans>Transfer fee:</Trans> <strong>{formattedXCallFee}</strong>
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
                <Flex justifyContent="center" mt={4} pt={4} className="border-top">
                  <TextButton onClick={handleDismiss}>
                    <Trans>{isProcessing ? 'Close' : 'Cancel'}</Trans>
                  </TextButton>

                  {isWrongChain ? (
                    <StyledButton onClick={handleSwitchChain}>
                      <Trans>Switch to {xChainMap[direction.from].name}</Trans>
                    </StyledButton>
                  ) : isProcessing ? (
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

export default XSwapModal;
