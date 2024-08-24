import React from 'react';

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
import { xChainMap } from '@/constants/xChains';
import useEthereumChainId from '@/hooks/useEthereumChainId';
import { MODAL_ID, modalActions, useModalStore } from '@/hooks/useModalStore';
import useWallets from '@/hooks/useWallets';
import { ApprovalState, useApproveCallback } from '@/lib/xcall/_hooks/useApproveCallback';
import useXCallFee from '@/lib/xcall/_hooks/useXCallFee';
import useXCallGasChecker from '@/lib/xcall/_hooks/useXCallGasChecker';
import { XTransactionInput, XTransactionType } from '@/lib/xcall/_zustand/types';
import { useXMessageStore } from '@/lib/xcall/_zustand/useXMessageStore';
import { useCreateWalletXService } from '@/lib/xcall/_zustand/useXServiceStore';
import { useXTransactionStore, xTransactionActions } from '@/lib/xcall/_zustand/useXTransactionStore';
import { switchEthereumChain, walletStrategy } from '@/packages/injective';
import { useBridgeDirection, useBridgeState, useDerivedBridgeInfo } from '@/store/bridge/hooks';
import { XWalletType } from '@/types';
import { formatBigNumber } from '@/utils';
import { getNetworkDisplayName } from '@/utils/xTokens';
import { Wallet } from '@injectivelabs/wallet-ts';
import { mainnet } from 'viem/chains';
import { useSwitchChain } from 'wagmi';
import LiquidFinanceIntegration from './LiquidFinanceIntegration';

const StyledXCallButton = styled(StyledButton)`
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

  const ethereumChainId = useEthereumChainId();

  // switch chain between evm chains
  const wallets = useWallets();
  const walletType = xChainMap[direction.from].xWalletType;
  const isWrongChain =
    wallets[walletType].xChainId !== direction.from ||
    (walletType === XWalletType.INJECTIVE &&
      walletStrategy.getWallet() === Wallet.Metamask &&
      ethereumChainId !== mainnet.id);
  const { switchChain } = useSwitchChain();
  const handleSwitchChain = async () => {
    if (walletType === XWalletType.INJECTIVE) {
      switchEthereumChain(mainnet.id);
    } else {
      switchChain({ chainId: xChainMap[direction.from].id as number });
    }
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
