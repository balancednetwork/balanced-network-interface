import React from 'react';

import { Trans, t } from '@lingui/macro';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Typography } from 'app/theme';
import Modal from 'app/components/Modal';
import { ModalContentWrapper } from 'app/components/ModalContent';
import { StyledButton as XCallButton } from 'app/pages/trade/xswap/_components/XCallSwapModal';
import { Button, TextButton } from 'app/components/Button';
import Spinner from 'app/components/Spinner';

import { getNetworkDisplayName } from 'app/pages/trade/bridge/utils';
import { useShouldLedgerSign } from 'store/application/hooks';

import { useModalStore, modalActions, MODAL_ID } from '../_zustand/useModalStore';

import BridgeTransferState from './BridgeTransferState';
import LiquidFinanceIntegration from './LiquidFinanceIntegration';
import { useBridgeInfo } from 'store/bridge/hooks';
import { bridgeTransferActions, useBridgeTransferStore } from '../_zustand/useBridgeTransferStore';
import { ApprovalState, useApproveCallback } from 'app/pages/trade/bridge/_hooks/useApproveCallback';
import { xChainMap } from 'app/pages/trade/bridge/_config/xChains';
import useXCallFee from '../_hooks/useXCallFee';
import { BridgeTransferType, XSwapInfo } from '../_zustand/types';
import {
  BridgeTransferStatusUpdater,
  bridgeTransferHistoryActions,
  useBridgeTransferHistoryStore,
} from '../_zustand/useBridgeTransferHistoryStore';
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
  useModalStore();
  useBridgeTransferHistoryStore();
  const { transferId } = useBridgeTransferStore();

  const isProcessing = transferId !== null;

  const { recipient, isLiquidFinanceEnabled, currencyAmountToBridge, account, isDenom, bridgeDirection } =
    useBridgeInfo();

  const { xCallFee } = useXCallFee(bridgeDirection.from, bridgeDirection.to);

  const xChain = xChainMap[bridgeDirection.from];
  const { approvalState, approveCallback } = useApproveCallback(currencyAmountToBridge, xChain.contracts.assetManager);

  const shouldLedgerSign = useShouldLedgerSign();

  const handleDismiss = () => {
    modalActions.closeModal(MODAL_ID.BRIDGE_TRANSFER_CONFIRM_MODAL);
    setTimeout(() => {
      bridgeTransferActions.reset();
    }, 500);
  };

  const handleTransfer = async () => {
    if (currencyAmountToBridge && recipient && account && xCallFee) {
      const bridgeInfo: XSwapInfo = {
        type: BridgeTransferType.BRIDGE,
        direction: bridgeDirection,
        inputAmount: currencyAmountToBridge,
        recipient,
        account,
        xCallFee,
        isLiquidFinanceEnabled,
      };
      await bridgeTransferActions.executeTransfer(bridgeInfo);
    }
  };

  const handleApprove = () => {
    approveCallback();
  };

  const gasChecker = useXCallGasChecker(bridgeDirection.from);

  return (
    <>
      {transferId && <BridgeTransferStatusUpdater transfer={bridgeTransferHistoryActions.get(transferId)} />}
      <Modal isOpen={modalActions.isModalOpen(MODAL_ID.BRIDGE_TRANSFER_CONFIRM_MODAL)} onDismiss={handleDismiss}>
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

          {isProcessing && <BridgeTransferState />}

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            {shouldLedgerSign && <Spinner></Spinner>}
            {!shouldLedgerSign && (
              <>
                <TextButton onClick={handleDismiss}>
                  <Trans>Cancel</Trans>
                </TextButton>
                {isProcessing ? (
                  <>
                    <StyledXCallButton disabled $loading>
                      <Trans>Transfer in progress</Trans>
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
