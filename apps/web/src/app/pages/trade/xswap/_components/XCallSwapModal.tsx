import React, { useMemo } from 'react';

import { Currency, CurrencyAmount, TradeType } from '@balancednetwork/sdk-core';
import { Trade } from '@balancednetwork/v1-sdk';
import { t, Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { Box, Flex } from 'rebass';
import styled, { css } from 'styled-components';

import { useARCH } from 'app/pages/trade/bridge/_config/tokens';
import { XChainId, XToken } from 'app/pages/trade/bridge/types';
import { getNetworkDisplayName } from 'app/pages/trade/bridge/utils';
import { Typography } from 'app/theme';
import { useChangeShouldLedgerSign, useShouldLedgerSign, useSwapSlippageTolerance } from 'store/application/hooks';
import { Field } from 'store/swap/reducer';
import { formatBigNumber, shortenAddress } from 'utils';

import { Button, TextButton } from 'app/components/Button';
import Modal from 'app/components/Modal';
import Spinner from 'app/components/Spinner';
import ModalContent from 'app/components/ModalContent';
import useXCallFee from 'app/pages/trade/bridge/_hooks/useXCallFee';
import { showMessageOnBeforeUnload } from 'utils/messages';
import { ApprovalState, useApproveCallback } from 'app/pages/trade/bridge/_hooks/useApproveCallback';
import { xChainMap } from '../../bridge/_config/xChains';
import { useModalStore, modalActions, MODAL_ID } from '../../bridge/_zustand/useModalStore';
import { XTransactionType, XTransactionInput } from '../../bridge/_zustand/types';
import useXCallGasChecker from '../../bridge/_hooks/useXCallGasChecker';
import {
  useXTransactionStore,
  xTransactionActions,
  XTransactionUpdater,
} from '../../bridge/_zustand/useXTransactionStore';
import XTransactionState from '../../bridge/_components/XTransactionState';

type XCallSwapModalProps = {
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

export const StyledButton = styled(Button)<{ $loading?: boolean }>`
  position: relative;

  &:after,
  &:before {
    content: '';
    position: absolute;
    width: 0;
    height: 2px;
    left: 0;
    border-radius: 5px;
    background: ${({ theme }) => theme.colors.primaryBright};
  }

  &:after {
    bottom: 0;
  }

  &:before {
    top: 0;
  }

  @keyframes expand {
    0% {
      width: 0;
      left: 50%;
      opacity: 0;
    }
    50% {
      width: 28%;
      left: 36%;
      opacity: 1;
    }
    100% {
      width: 100%;
      left: 0%;
      opacity: 0;
    }
  }

  ${({ $loading }) =>
    $loading &&
    css`
    &:after {
      animation: expand 2s infinite;
    }
    `}

`;

export const presenceVariants = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 },
};

const XCallSwapModal = ({
  account,
  currencies,
  executionTrade,
  direction,
  recipient,
  clearInputs,
}: XCallSwapModalProps) => {
  useModalStore();
  const { currentId } = useXTransactionStore();
  const currentXTransaction = xTransactionActions.get(currentId);
  const isProcessing: boolean = currentId !== null;

  const shouldLedgerSign = useShouldLedgerSign();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();
  const slippageTolerance = useSwapSlippageTolerance();

  const { xCallFee, formattedXCallFee } = useXCallFee(direction.from, direction.to);

  const xChain = xChainMap[direction.from];
  const _inputAmount = useMemo(() => {
    return executionTrade?.inputAmount && currencies[Field.INPUT]
      ? CurrencyAmount.fromFractionalAmount(
          XToken.getXToken(direction.from, currencies[Field.INPUT].wrapped),
          executionTrade.inputAmount.numerator,
          executionTrade.inputAmount.denominator,
        )
      : undefined;
  }, [executionTrade, direction.from, currencies]);
  const { approvalState, approveCallback } = useApproveCallback(_inputAmount, xChain.contracts.assetManager);

  const cleanupSwap = () => {
    clearInputs();
    window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
    changeShouldLedgerSign(false);
  };

  const handleDismiss = () => {
    modalActions.closeModal(MODAL_ID.XCALL_SWAP_MODAL);
    setTimeout(() => {
      xTransactionActions.reset();
    }, 500);
  };

  const handleXCallSwap = async () => {
    if (!executionTrade) return;
    if (!account) return;
    if (!recipient) return;
    if (!xCallFee) return;
    if (!_inputAmount) return;

    const xTransactionInput: XTransactionInput & { cleanupSwap: () => void } = {
      type: XTransactionType.SWAP,
      direction,
      executionTrade,
      account,
      recipient,
      inputAmount: _inputAmount,
      slippageTolerance,
      xCallFee,
      cleanupSwap,
    };

    await xTransactionActions.executeTransfer(xTransactionInput);
  };

  const gasChecker = useXCallGasChecker(direction.from);

  return (
    <>
      {currentXTransaction && <XTransactionUpdater xTransaction={currentXTransaction} />}
      <Modal isOpen={modalActions.isModalOpen(MODAL_ID.XCALL_SWAP_MODAL)} onDismiss={handleDismiss}>
        <ModalContent noMessages={isProcessing} noCurrencyBalanceErrorMessage>
          <Typography textAlign="center" mb="5px" as="h3" fontWeight="normal">
            <Trans>
              Swap {currencies[Field.INPUT]?.symbol} for {currencies[Field.OUTPUT]?.symbol}?
            </Trans>
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center">
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

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            {shouldLedgerSign && <Spinner></Spinner>}
            {!shouldLedgerSign && (
              <>
                <TextButton onClick={handleDismiss}>
                  <Trans>Cancel</Trans>
                </TextButton>

                {isProcessing ? (
                  <>
                    <StyledButton disabled $loading>
                      <Trans>Swap in progress</Trans>
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
              </>
            )}
          </Flex>

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

export default XCallSwapModal;
