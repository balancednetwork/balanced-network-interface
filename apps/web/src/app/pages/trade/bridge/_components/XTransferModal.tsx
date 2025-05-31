import React, { useCallback, useEffect, useState } from 'react';

import { Trans, t } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button, TextButton } from '@/app/components/Button';
import { StyledButton } from '@/app/components/Button/StyledButton';
import Modal from '@/app/components/Modal';
import { ModalContentWrapper } from '@/app/components/ModalContent';
import XTransactionState from '@/app/components/XTransactionState';
import { Typography } from '@/app/theme';
import { useAnalytics } from '@/hooks/useAnalytics';
import { ApprovalState, useApproveCallback } from '@/hooks/useApproveCallback';
import { useEvmSwitchChain } from '@/hooks/useEvmSwitchChain';
import { MODAL_ID, modalActions, useModalOpen } from '@/hooks/useModalStore';
import { useWalletPrompting } from '@/hooks/useWalletPrompting';
import useXCallGasChecker from '@/hooks/useXCallGasChecker';
import { useBridgeDirection, useBridgeState, useDerivedBridgeInfo } from '@/store/bridge/hooks';
import { formatBigNumber } from '@/utils';
import { formatSymbol } from '@/utils/formatter';
import { getNetworkDisplayName } from '@/utils/xTokens';
import { useSendXTransaction, xChainMap } from '@balancednetwork/xwagmi';
import { useXCallFee } from '@balancednetwork/xwagmi';
import { XTransactionInput, XTransactionStatus, XTransactionType } from '@balancednetwork/xwagmi';
import { xTransactionActions } from '@balancednetwork/xwagmi';
import { AnimatePresence, motion } from 'framer-motion';
import LiquidFinanceIntegration from './LiquidFinanceIntegration';

const StyledXCallButton = styled(StyledButton)`
  transition: all 0.2s ease;

  &.disabled {
    background: rgba(255, 255, 255, 0.15);
    pointer-events: none;
    cursor: not-allowed;
  }
`;

function XTransferModal({ modalId = MODAL_ID.XTRANSFER_CONFIRM_MODAL }) {
  const modalOpen = useModalOpen(modalId);
  const { track } = useAnalytics();
  const { isWalletPrompting, setWalletPrompting } = useWalletPrompting();
  const [currentId, setCurrentId] = useState<string | null>(null);
  const currentXTransaction = xTransactionActions.get(currentId);
  const isProcessing = currentId !== null; // TODO: can be swap is processing
  const isExecuted =
    currentXTransaction?.status === XTransactionStatus.success ||
    currentXTransaction?.status === XTransactionStatus.failure;

  const { recipient, isLiquidFinanceEnabled } = useBridgeState();
  const { currencyAmountToBridge, account } = useDerivedBridgeInfo();
  const direction = useBridgeDirection();

  const { xCallFee, formattedXCallFee } = useXCallFee(direction.from, direction.to);

  const xChain = xChainMap[direction.from];
  const { approvalState, approveCallback } = useApproveCallback(currencyAmountToBridge, xChain.contracts.assetManager);

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
  const handleTransfer = async () => {
    if (currencyAmountToBridge && recipient && account && xCallFee) {
      const bridgeInfo: XTransactionInput = {
        type: XTransactionType.BRIDGE,
        direction: direction,
        inputAmount: currencyAmountToBridge,
        recipient,
        account,
        xCallFee,
        isLiquidFinanceEnabled,
      };

      setWalletPrompting(true);
      const xTransactionId = await sendXTransaction(bridgeInfo);
      setCurrentId(xTransactionId || null);

      track('bridge', {
        from: xChainMap[direction.from].name,
        to: xChainMap[direction.to].name,
      });
    }
  };

  const handleApprove = () => {
    approveCallback();
  };

  const gasChecker = useXCallGasChecker(direction.from, currencyAmountToBridge);

  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(direction.from);

  return (
    <>
      <Modal isOpen={modalOpen} onDismiss={handleDismiss}>
        <ModalContentWrapper>
          <Typography textAlign="center" mb="5px">
            {t`Transfer asset cross-chain?`}
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
            {`${formatBigNumber(new BigNumber(currencyAmountToBridge?.toFixed() || 0), 'currency')} ${formatSymbol(
              currencyAmountToBridge?.currency.symbol,
            )}`}
          </Typography>

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">
                <Trans>From</Trans>
              </Typography>
              <Typography variant="p" textAlign="center">
                {getNetworkDisplayName(direction.from)}
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">
                <Trans>To</Trans>
              </Typography>
              <Typography variant="p" textAlign="center">
                {getNetworkDisplayName(direction.to)}
              </Typography>
            </Box>
          </Flex>

          <Typography textAlign="center" mb="2px">
            {`${getNetworkDisplayName(direction.to)} `}
            <Trans>address</Trans>
          </Typography>

          <Typography variant="p" textAlign="center" margin={'auto'} maxWidth={225} fontSize={16}>
            {recipient}
          </Typography>

          <Typography textAlign="center" mt={3}>
            <Trans>Transfer fee:</Trans> <strong>{formattedXCallFee}</strong>
          </Typography>

          <LiquidFinanceIntegration />

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
                    <StyledXCallButton onClick={handleSwitchChain}>
                      <Trans>Switch to {xChainMap[direction.from].name}</Trans>
                    </StyledXCallButton>
                  ) : isProcessing ? (
                    <>
                      <StyledXCallButton disabled $loading>
                        <Trans>Transferring</Trans>
                      </StyledXCallButton>
                    </>
                  ) : (
                    <>
                      {approvalState !== ApprovalState.APPROVED ? (
                        <Button onClick={handleApprove} disabled={approvalState === ApprovalState.PENDING}>
                          {approvalState === ApprovalState.PENDING ? 'Approving' : 'Approve transfer'}
                        </Button>
                      ) : (
                        <StyledXCallButton
                          onClick={handleTransfer}
                          disabled={!gasChecker.hasEnoughGas || isWalletPrompting}
                        >
                          <Trans>{isWalletPrompting ? 'Waiting for wallet...' : 'Transfer'}</Trans>
                        </StyledXCallButton>
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
        </ModalContentWrapper>
      </Modal>
    </>
  );
}

export default XTransferModal;
