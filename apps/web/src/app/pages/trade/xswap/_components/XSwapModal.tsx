import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Currency, CurrencyAmount, TradeType, XChainId, XToken } from '@balancednetwork/sdk-core';
import { Trade } from '@balancednetwork/v1-sdk';
import { Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { Box, Flex } from 'rebass';

import { Button, TextButton } from '@/app/components/Button';
import { StyledButton } from '@/app/components/Button/StyledButton';
import XTransactionState from '@/app/components/XTransactionState';
import { Modal } from '@/app/components2/Modal';
import { Typography } from '@/app/theme';
import { SLIPPAGE_MODAL_WARNING_THRESHOLD } from '@/constants/misc';
import { ApprovalState, useApproveCallback } from '@/hooks/useApproveCallback';
import { useEvmSwitchChain } from '@/hooks/useEvmSwitchChain';
import { useSendXTransaction } from '@/hooks/useSendXTransaction';
import useXCallGasChecker from '@/hooks/useXCallGasChecker';
import { useSwapSlippageTolerance } from '@/store/application/hooks';
import { Field } from '@/store/swap/reducer';
import { formatBigNumber, shortenAddress } from '@/utils';
import { showMessageOnBeforeUnload } from '@/utils/messages';
import { getNetworkDisplayName } from '@/utils/xTokens';
import { xChainMap } from '@/xwagmi/constants/xChains';
import useXCallFee from '@/xwagmi/xcall/hooks/useXCallFee';
import { XTransactionInput, XTransactionStatus, XTransactionType } from '@/xwagmi/xcall/types';
import { xTransactionActions } from '@/xwagmi/xcall/zustand/useXTransactionStore';
import { AnimatePresence, motion } from 'framer-motion';

type XSwapModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
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

export const presenceVariants = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 },
};

const XSwapModal = ({
  open,
  setOpen,
  account,
  currencies,
  executionTrade,
  direction,
  recipient,
  clearInputs,
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

  const handleDismiss = useCallback(() => {
    setOpen(false);
    setTimeout(() => {
      setCurrentId(null);
    }, 500);
  }, [setOpen]);

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

  const gasChecker = useXCallGasChecker(direction.from);

  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(direction.from);

  return (
    <Modal open={open} setOpen={setOpen} title="">
      {/* <ModalContent noMessages={isProcessing} noCurrencyBalanceErrorMessage> */}
      <Typography textAlign="center" mb="5px" as="h3" fontWeight="normal">
        <Trans>
          Swap {currencies[Field.INPUT]?.symbol} for {currencies[Field.OUTPUT]?.symbol}?
        </Trans>
      </Typography>

      <Typography variant="p" fontWeight="bold" textAlign="center" color={showWarning ? 'alert' : 'text'}>
        <Trans>
          {`${formatBigNumber(new BigNumber(executionTrade?.executionPrice.toFixed() || 0), 'ratio')} ${
            executionTrade?.executionPrice.quoteCurrency.symbol
          } 
              per ${executionTrade?.executionPrice.baseCurrency.symbol}`}
        </Trans>
      </Typography>

      <Flex my={4}>
        <Box width={1 / 2} className="border-right">
          <Typography textAlign="center">
            <Trans>Pay</Trans>
          </Typography>
          <Typography variant="p" textAlign="center" py="5px">
            {formatBigNumber(new BigNumber(executionTrade?.inputAmount.toFixed() || 0), 'currency')}{' '}
            {currencies[Field.INPUT]?.symbol}
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
            {currencies[Field.OUTPUT]?.symbol}
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
        <Trans>Includes a fee of</Trans>{' '}
        <strong>
          {formatBigNumber(new BigNumber(executionTrade?.fee.toFixed() || 0), 'currency')}{' '}
          {currencies[Field.INPUT]?.symbol}
        </strong>
        .
      </Typography>

      <Typography textAlign="center">
        <Trans>You'll also pay</Trans> <strong>{formattedXCallFee}</strong> <Trans>to transfer cross-chain.</Trans>
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
      {/* </ModalContent> */}
    </Modal>
  );
};

export default XSwapModal;
