import React from 'react';

import { Trans, t } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';
import { useSwitchChain } from 'wagmi';

import { Button, TextButton } from '@/app/components/Button';
import Modal from '@/app/components/Modal';
import { ModalContentWrapper } from '@/app/components/ModalContent';
import Spinner from '@/app/components/Spinner';
import { ApprovalState, useApproveCallback } from '@/app/pages/trade/bridge/_hooks/useApproveCallback';
import { getNetworkDisplayName } from '@/app/pages/trade/bridge/utils';
import { StyledButton as XCallButton } from '@/app/pages/trade/xswap/_components/shared';
import { Typography } from '@/app/theme';
import { xChainMap } from '@/constants/xChains';
import useWallets from '@/hooks/useWallets';
import { useShouldLedgerSign } from '@/store/application/hooks';
import { useBridgeDirection, useBridgeState, useDerivedBridgeInfo } from '@/store/bridge/hooks';
import { formatBigNumber } from '@/utils';
import useXCallFee from '../_hooks/useXCallFee';
import useXCallGasChecker from '../_hooks/useXCallGasChecker';
import { XTransactionInput, XTransactionType } from '../_zustand/types';
import { MODAL_ID, modalActions, useModalStore } from '../_zustand/useModalStore';
import { useXMessageStore } from '../_zustand/useXMessageStore';
import { useCreateWalletXService } from '../_zustand/useXServiceStore';
import { useXTransactionStore, xTransactionActions } from '../_zustand/useXTransactionStore';
import LiquidFinanceIntegration from './LiquidFinanceIntegration';
import XTransactionState from './XTransactionState';

const StyledXCallButton = styled(XCallButton)`
  transition: all 0.2s ease;

  &.disabled {
    background: rgba(255, 255, 255, 0.15);
    pointer-events: none;
    cursor: not-allowed;
  }
`;

function XTransferModal() {
  useModalStore();
  useXMessageStore();
  const { currentId } = useXTransactionStore();
  const currentXTransaction = xTransactionActions.get(currentId);
  const isProcessing = currentId !== null; // TODO: can be swap is processing

  const { recipient, isLiquidFinanceEnabled } = useBridgeState();
  const { currencyAmountToBridge, account } = useDerivedBridgeInfo();
  const direction = useBridgeDirection();

  useCreateWalletXService(direction.from);

  const { xCallFee } = useXCallFee(direction.from, direction.to);

  const xChain = xChainMap[direction.from];
  const { approvalState, approveCallback } = useApproveCallback(currencyAmountToBridge, xChain.contracts.assetManager);

  const shouldLedgerSign = useShouldLedgerSign();

  const handleDismiss = () => {
    modalActions.closeModal(MODAL_ID.XTRANSFER_CONFIRM_MODAL);
    setTimeout(() => {
      xTransactionActions.reset();
    }, 500);
  };

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
      await xTransactionActions.executeTransfer(bridgeInfo);
    }
  };

  const handleApprove = () => {
    approveCallback();
  };

  const gasChecker = useXCallGasChecker(direction.from);

  // switch chain between evm chains
  const wallets = useWallets();
  const walletType = xChainMap[direction.from].xWalletType;
  const isWrongChain = wallets[walletType].xChainId !== direction.from;
  const { switchChain } = useSwitchChain();
  const handleSwitchChain = () => {
    switchChain({ chainId: xChainMap[direction.from].id as number });
  };

  return (
    <>
      <Modal isOpen={modalActions.isModalOpen(MODAL_ID.XTRANSFER_CONFIRM_MODAL)} onDismiss={handleDismiss}>
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
            {shouldLedgerSign && <Spinner></Spinner>}
            {!shouldLedgerSign && (
              <>
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
