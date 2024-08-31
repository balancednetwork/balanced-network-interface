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
import { ApprovalState, useApproveCallback } from '@/hooks/useApproveCallback';
import { useEvmSwitchChain } from '@/hooks/useEvmSwitchChain';
import { MODAL_ID, modalActions, useModalOpen } from '@/hooks/useModalStore';
import { useSendXTransaction } from '@/hooks/useSendXTransaction';
import useXCallGasChecker from '@/hooks/useXCallGasChecker';
import { useBridgeDirection, useBridgeState, useDerivedBridgeInfo } from '@/store/bridge/hooks';
import { formatBigNumber } from '@/utils';
import { getNetworkDisplayName } from '@/utils/xTokens';
import { xChainMap } from '@/xwagmi/constants/xChains';
import useXCallFee from '@/xwagmi/xcall/hooks/useXCallFee';
import { XTransactionInput, XTransactionStatus, XTransactionType } from '@/xwagmi/xcall/types';
import { xTransactionActions } from '@/xwagmi/xcall/zustand/useXTransactionStore';
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

  const [currentId, setCurrentId] = useState<string | null>(null);
  const currentXTransaction = xTransactionActions.get(currentId);
  const isProcessing = currentId !== null; // TODO: can be swap is processing

  const { recipient, isLiquidFinanceEnabled } = useBridgeState();
  const { currencyAmountToBridge, account } = useDerivedBridgeInfo();
  const direction = useBridgeDirection();

  const { xCallFee } = useXCallFee(direction.from, direction.to);

  const xChain = xChainMap[direction.from];
  const { approvalState, approveCallback } = useApproveCallback(currencyAmountToBridge, xChain.contracts.assetManager);

  const handleDismiss = useCallback(() => {
    modalActions.closeModal(modalId);
    setTimeout(() => {
      setCurrentId(null);
    }, 500);
  }, [modalId]);

  useEffect(() => {
    if (
      currentXTransaction &&
      (currentXTransaction.status === XTransactionStatus.success ||
        currentXTransaction.status === XTransactionStatus.failure)
    ) {
      handleDismiss();
    }
  }, [currentXTransaction, handleDismiss]);

  const { sendXTransaction } = useSendXTransaction();
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
      const xTransactionId = await sendXTransaction(bridgeInfo);
      setCurrentId(xTransactionId || null);
    }
  };

  const handleApprove = () => {
    approveCallback();
  };

  const gasChecker = useXCallGasChecker(direction.from);

  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(direction.from);

  return (
    <>
      <Modal isOpen={modalOpen} onDismiss={handleDismiss}>
        <ModalContentWrapper>
          <Typography textAlign="center" mb="5px">
            {t`Transfer asset cross-chain?`}
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
            {`${formatBigNumber(new BigNumber(currencyAmountToBridge?.toFixed() || 0), 'currency')} ${
              currencyAmountToBridge?.currency.symbol
            }`}
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

          <LiquidFinanceIntegration />

          {currentXTransaction && <XTransactionState xTransaction={currentXTransaction} />}

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
                  <StyledXCallButton onClick={handleTransfer} disabled={!gasChecker.hasEnoughGas}>
                    <Trans>Transfer</Trans>
                  </StyledXCallButton>
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
        </ModalContentWrapper>
      </Modal>
    </>
  );
}

export default XTransferModal;
