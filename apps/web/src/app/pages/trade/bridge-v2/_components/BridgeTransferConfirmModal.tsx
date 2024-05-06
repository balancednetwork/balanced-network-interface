import React, { useEffect, useState } from 'react';

import { Trans, t } from '@lingui/macro';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Typography } from 'app/theme';
import Modal from 'app/components/Modal';
import { ModalContentWrapper } from 'app/components/ModalContent';
import { StyledButton as XCallButton } from 'app/components/trade/XCallSwapModal';
import { Button, TextButton } from 'app/components/Button';
import Spinner from 'app/components/Spinner';

import { getNetworkDisplayName } from 'app/pages/trade/bridge-v2/utils';
import { useShouldLedgerSign } from 'store/application/hooks';

import {
  useBridgeTransferConfirmModalStore,
  bridgeTransferConfirmModalActions,
} from '../_zustand/useBridgeTransferConfirmModalStore';

import BridgeTransferState from './BridgeTransferState';
import LiquidFinanceIntegration from '../../bridge/_components/LiquidFinanceIntegration';
import { useBridgeInfo } from 'store/bridge/hooks';
import {
  bridgeTransferActions,
  useBridgeTransferStore,
  BridgeTransferStatusUpdater,
} from '../_zustand/useBridgeTransferStore';
import { ApprovalState, useApproveCallback } from 'app/pages/trade/bridge-v2/_hooks/useApproveCallback';
import { xChainMap } from 'app/pages/trade/bridge-v2/_config/xChains';
import useXCallFee from '../_hooks/useXCallFee';
import useXCallGasChecker from '../_hooks/useXCallGasChecker';

const StyledXCallButton = styled(XCallButton)`
  transition: all 0.2s ease;

  &.disabled {
    background: rgba(255, 255, 255, 0.15);
    pointer-events: none;
    cursor: not-allowed;
  }
`;

export function BridgeTransferConfirmModal() {
  const { modalOpen } = useBridgeTransferConfirmModalStore();
  const { isTransferring } = useBridgeTransferStore();

  const {
    currency: currencyToBridge,
    recipient,
    typedValue,
    isLiquidFinanceEnabled,
    currencyAmountToBridge,
    account,
    isDenom,
    bridgeDirection,
  } = useBridgeInfo();

  const { xCallFee } = useXCallFee(bridgeDirection.from, bridgeDirection.to);

  const xChain = xChainMap[bridgeDirection.from];
  const { approvalState, approveCallback } = useApproveCallback(currencyAmountToBridge, xChain.contracts.assetManager);

  const shouldLedgerSign = useShouldLedgerSign();

  const { data: gasChecker } = useXCallGasChecker(bridgeDirection.from, bridgeDirection.to);

  const handleDismiss = () => {
    bridgeTransferConfirmModalActions.closeModal();
  };

  const handleTransfer = async () => {
    if (currencyAmountToBridge && recipient && account && xCallFee) {
      const bridgeInfo = {
        bridgeDirection,
        currencyAmountToBridge,
        recipient,
        account,
        xCallFee,
        isDenom,
        isLiquidFinanceEnabled,
      };
      await bridgeTransferActions.executeTransfer(bridgeInfo);
    }

    // await xCallEventActions.startScanner(bridgeDirection.to, 4393620);
  };

  const handleApprove = () => {
    approveCallback();
  };

  return (
    <>
      <BridgeTransferStatusUpdater />
      <Modal isOpen={modalOpen} onDismiss={handleDismiss}>
        <ModalContentWrapper>
          <Typography textAlign="center" mb="5px">
            {t`Transfer asset cross-chain?`}
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
            {`${currencyAmountToBridge?.toFixed(2)} ${currencyAmountToBridge?.currency.symbol}`}
          </Typography>

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">
                <Trans>From</Trans>
              </Typography>
              <Typography variant="p" textAlign="center">
                {getNetworkDisplayName(bridgeDirection.from)}
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">
                <Trans>To</Trans>
              </Typography>
              <Typography variant="p" textAlign="center">
                {getNetworkDisplayName(bridgeDirection.to)}
              </Typography>
            </Box>
          </Flex>

          <Typography textAlign="center" mb="2px">
            {`${getNetworkDisplayName(bridgeDirection.to)} `}
            <Trans>address</Trans>
          </Typography>

          <Typography variant="p" textAlign="center" margin={'auto'} maxWidth={225} fontSize={16}>
            {recipient}
          </Typography>

          <LiquidFinanceIntegration />

          {isTransferring && <BridgeTransferState />}

          {gasChecker && !gasChecker.hasEnoughGas && (
            <Typography mt={4} mb={-1} textAlign="center" color="alert">
              {gasChecker.errorMessage || t`Not enough gas to complete the swap.`}
            </Typography>
          )}

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            {shouldLedgerSign && <Spinner></Spinner>}
            {!shouldLedgerSign && (
              <>
                <TextButton onClick={handleDismiss}>
                  <Trans>Cancel</Trans>
                </TextButton>
                {approvalState !== ApprovalState.APPROVED && !isTransferring && (
                  <>
                    <Button onClick={handleApprove} disabled={approvalState === ApprovalState.PENDING}>
                      {approvalState === ApprovalState.PENDING ? 'Approving' : 'Approve'}
                    </Button>
                  </>
                )}
                {approvalState === ApprovalState.APPROVED && (
                  <>
                    <StyledXCallButton onClick={handleTransfer} disabled={isTransferring}>
                      {!isTransferring ? <Trans>Transfer</Trans> : <Trans>xCall in progress</Trans>}
                    </StyledXCallButton>
                  </>
                )}
              </>
            )}
          </Flex>
        </ModalContentWrapper>
      </Modal>
    </>
  );
}
