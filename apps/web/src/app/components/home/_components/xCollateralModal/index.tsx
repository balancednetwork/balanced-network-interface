import React, { useMemo } from 'react';

import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { Trans, t } from '@lingui/macro';
import { Box, Flex } from 'rebass';

import { XChainId, XToken } from 'app/pages/trade/bridge/types';
import { Typography } from 'app/theme';
import { MODAL_ID, modalActions, useModalStore } from 'app/pages/trade/bridge/_zustand/useModalStore';
import {
  XTransactionUpdater,
  useXTransactionStore,
  xTransactionActions,
} from 'app/pages/trade/bridge/_zustand/useXTransactionStore';
import useXCallFee from 'app/pages/trade/bridge/_hooks/useXCallFee';
import { xChainMap } from 'app/pages/trade/bridge/_config/xChains';
import { ApprovalState, useApproveCallback } from 'app/pages/trade/bridge/_hooks/useApproveCallback';
import { XTransactionInput, XTransactionType } from 'app/pages/trade/bridge/_zustand/types';
import useXCallGasChecker from 'app/pages/trade/bridge/_hooks/useXCallGasChecker';
import useWallets from 'app/pages/trade/bridge/_hooks/useWallets';
import { useSwitchChain } from 'wagmi';
import Modal from 'app/components/Modal';
import ModalContent from 'app/components/ModalContent';
import XTransactionState from 'app/pages/trade/bridge/_components/XTransactionState';
import { Button, TextButton } from 'app/components/Button';
import { StyledButton } from 'app/pages/trade/xswap/_components/shared';
import { useCollateralActionHandlers, useDerivedCollateralInfo } from 'store/collateral/hooks';
import useLoanWalletServiceHandler from '../../useLoanWalletServiceHandler';

export enum XCollateralAction {
  DEPOSIT = 'DEPOSIT',
  WITHDRAW = 'WITHDRAW',
}

type XCollateralModalProps = {
  account: string | undefined;
  sourceChain: XChainId;
  action: XCollateralAction;
  storedModalValues: {
    amount: string;
    before: string;
    after: string;
  };
  currencyAmount?: CurrencyAmount<XToken>;
};

export const presenceVariants = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 },
};

const XCollateralModal = ({
  account,
  currencyAmount,
  sourceChain,
  action,
  storedModalValues,
}: XCollateralModalProps) => {
  useModalStore();
  const { collateralType } = useDerivedCollateralInfo();
  const { currentId } = useXTransactionStore();
  const currentXTransaction = xTransactionActions.get(currentId);
  const isProcessing: boolean = currentId !== null;
  const { onAdjust: adjust } = useCollateralActionHandlers();

  const { xCallFee, formattedXCallFee } = useXCallFee(sourceChain, '0x1.icon');

  const xChain = xChainMap[sourceChain];
  const _inputAmount = useMemo(() => {
    return currencyAmount ? currencyAmount : undefined;
  }, [currencyAmount]);
  const { approvalState, approveCallback } = useApproveCallback(_inputAmount, xChain.contracts.assetManager);

  const cancelAdjusting = React.useCallback(() => {
    adjust(false);
  }, [adjust]);

  const handleDismiss = () => {
    modalActions.closeModal(MODAL_ID.XCOLLATERAL_CONFIRM_MODAL);
    setTimeout(() => {
      xTransactionActions.reset();
    }, 500);
  };

  const handleXCollateralAction = async () => {
    if (!account) return;
    if (!xCallFee) return;
    if (!_inputAmount) return;

    const type =
      action === XCollateralAction.DEPOSIT ? XTransactionType.DEPOSIT_COLLATERAL : XTransactionType.WITHDRAW_COLLATERAL;

    const direction = {
      from: sourceChain,
      to: action === XCollateralAction.DEPOSIT ? ('0x1.icon' as XChainId) : sourceChain,
    };

    const xTransactionInput: XTransactionInput = {
      type,
      direction,
      account,
      inputAmount: _inputAmount,
      xCallFee,
      usedCollateral: collateralType,
      callback: cancelAdjusting,
    };

    await xTransactionActions.executeTransfer(xTransactionInput);
  };

  const gasChecker = useXCallGasChecker(sourceChain);

  // switch chain between evm chains
  useLoanWalletServiceHandler();
  const wallets = useWallets();
  const walletType = xChainMap[sourceChain].xWalletType;
  const isWrongChain = wallets[walletType].xChainId !== sourceChain;
  const { switchChain } = useSwitchChain();
  const handleSwitchChain = () => {
    switchChain({ chainId: xChainMap[sourceChain].id as number });
  };

  return (
    <>
      {currentXTransaction && <XTransactionUpdater xTransaction={currentXTransaction} />}
      <Modal isOpen={modalActions.isModalOpen(MODAL_ID.XCOLLATERAL_CONFIRM_MODAL)} onDismiss={handleDismiss}>
        <ModalContent noMessages={isProcessing} noCurrencyBalanceErrorMessage>
          <Typography textAlign="center" mb="5px">
            {action === XCollateralAction.DEPOSIT
              ? t`Deposit ${_inputAmount?.currency.symbol} collateral?`
              : t`Withdraw ${_inputAmount?.currency.symbol} collateral?`}
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
            <Trans>You'll also pay</Trans> <strong>{formattedXCallFee}</strong> <Trans>to transfer cross-chain.</Trans>
          </Typography>

          {currentXTransaction && <XTransactionState xTransaction={currentXTransaction} />}

          <Flex justifyContent="center" mt="20px" pt="20px" className="border-top">
            <>
              <TextButton onClick={handleDismiss}>
                <Trans>Cancel</Trans>
              </TextButton>

              {isWrongChain ? (
                <StyledButton onClick={handleSwitchChain}>
                  <Trans>Switch to</Trans>
                  {` ${xChainMap[sourceChain].name}`}
                </StyledButton>
              ) : isProcessing ? (
                <>
                  <StyledButton disabled $loading>
                    {action === XCollateralAction.DEPOSIT ? (
                      <Trans>Depositing...</Trans>
                    ) : (
                      <Trans>Withdrawing...</Trans>
                    )}
                  </StyledButton>
                </>
              ) : (
                <>
                  {approvalState !== ApprovalState.APPROVED ? (
                    <Button onClick={approveCallback} disabled={approvalState === ApprovalState.PENDING}>
                      {approvalState === ApprovalState.PENDING ? 'Approving' : 'Approve transfer'}
                    </Button>
                  ) : (
                    <StyledButton onClick={handleXCollateralAction} disabled={!gasChecker.hasEnoughGas}>
                      {action === XCollateralAction.DEPOSIT ? <Trans>Deposit</Trans> : <Trans>Withdraw</Trans>}
                    </StyledButton>
                  )}
                </>
              )}
            </>
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

export default XCollateralModal;
