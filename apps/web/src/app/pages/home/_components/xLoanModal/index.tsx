import React, { useMemo } from 'react';

import { CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import { Trans, t } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { Box, Flex } from 'rebass';

import { XChainId } from 'app/pages/trade/bridge/types';
import { Typography } from 'app/theme';
import { MODAL_ID, modalActions, useModalStore } from 'app/pages/trade/bridge/_zustand/useModalStore';
import {
  XTransactionUpdater,
  useXTransactionStore,
  xTransactionActions,
} from 'app/pages/trade/bridge/_zustand/useXTransactionStore';
import useXCallFee from 'app/pages/trade/bridge/_hooks/useXCallFee';
import { xChainMap } from 'app/pages/trade/bridge/_config/xChains';
import { XTransactionInput, XTransactionType } from 'app/pages/trade/bridge/_zustand/types';
import useXCallGasChecker from 'app/pages/trade/bridge/_hooks/useXCallGasChecker';
import useWallets from 'app/pages/trade/bridge/_hooks/useWallets';
import { useSwitchChain } from 'wagmi';
import Modal from 'app/components/Modal';
import ModalContent from 'app/components/ModalContent';
import XTransactionState from 'app/pages/trade/bridge/_components/XTransactionState';
import { TextButton } from 'app/components/Button';
import { StyledButton } from 'app/pages/trade/xswap/_components/shared';
import { useDerivedLoanInfo, useLoanActionHandlers, useLoanRecipientNetwork } from 'store/loan/hooks';
import { useCollateralType } from 'store/collateral/hooks';
import { ICON_XCALL_NETWORK_ID } from 'constants/config';
import useLoanWalletServiceHandler from '../../useLoanWalletServiceHandler';

export enum XLoanAction {
  BORROW = 'BORROW',
  REPAY = 'REPAY',
}

type XLoanModalProps = {
  collateralAccount: string | undefined;
  sourceChain: XChainId;
  action: XLoanAction;
  originationFee: BigNumber;
  storedModalValues: {
    amount: string;
    before: string;
    after: string;
    action: XLoanAction;
  };
  bnUSDAmount?: CurrencyAmount<Token>;
  interestRate?: BigNumber;
};

export const presenceVariants = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 },
};

const XLoanModal = ({
  collateralAccount,
  bnUSDAmount,
  sourceChain,
  action,
  originationFee,
  interestRate,
  storedModalValues,
}: XLoanModalProps) => {
  useModalStore();
  const { currentId } = useXTransactionStore();
  const currentXTransaction = xTransactionActions.get(currentId);
  const isProcessing: boolean = currentId !== null;
  const loanNetwork = useLoanRecipientNetwork();
  const { direction, receiver } = useDerivedLoanInfo();
  const collateralType = useCollateralType();
  const { onAdjust: adjust } = useLoanActionHandlers();
  const activeChain = useLoanWalletServiceHandler();

  const collateralNetworkAddress = `${sourceChain}/${collateralAccount}`;
  const loanNetworkAddress = receiver;

  const { xCallFee, formattedXCallFee } = useXCallFee(
    action === XLoanAction.BORROW ? sourceChain : loanNetwork,
    action === XLoanAction.BORROW ? loanNetwork : sourceChain,
  );

  const _inputAmount = useMemo(() => {
    return bnUSDAmount ? bnUSDAmount : undefined;
  }, [bnUSDAmount]);

  const cancelAdjusting = React.useCallback(() => {
    adjust(false);
  }, [adjust]);

  const handleDismiss = () => {
    modalActions.closeModal(MODAL_ID.XLOAN_CONFIRM_MODAL);
    setTimeout(() => {
      xTransactionActions.reset();
    }, 500);
  };

  const handleXLoanAction = async () => {
    if (!collateralAccount) return;
    if (!loanNetworkAddress) return;
    if (!xCallFee) return;
    if (!_inputAmount) return;
    if (!collateralType) return;

    const xTransactionInput: XTransactionInput = {
      type: action === XLoanAction.BORROW ? XTransactionType.BORROW : XTransactionType.REPAY,
      direction: action === XLoanAction.BORROW ? direction : { from: loanNetwork, to: ICON_XCALL_NETWORK_ID },
      account: action === XLoanAction.BORROW ? collateralAccount : receiver.split('/')[1],
      inputAmount: _inputAmount,
      usedCollateral: collateralType,
      recipient: action === XLoanAction.BORROW ? receiver : collateralNetworkAddress,
      xCallFee,
      callback: cancelAdjusting,
    };

    await xTransactionActions.executeTransfer(xTransactionInput);
  };

  const gasChecker = useXCallGasChecker(sourceChain);

  // switch chain between evm chains
  const wallets = useWallets();
  const walletType = xChainMap[sourceChain].xWalletType;
  const isWrongChain = wallets[walletType].xChainId !== activeChain;
  const { switchChain } = useSwitchChain();
  const handleSwitchChain = () => {
    switchChain({ chainId: xChainMap[activeChain].id as number });
  };

  return (
    <>
      {currentXTransaction && <XTransactionUpdater xTransaction={currentXTransaction} />}
      <Modal isOpen={modalActions.isModalOpen(MODAL_ID.XLOAN_CONFIRM_MODAL)} onDismiss={handleDismiss}>
        <ModalContent noMessages={isProcessing} noCurrencyBalanceErrorMessage>
          <Typography textAlign="center" mb="5px">
            {storedModalValues.action === XLoanAction.BORROW ? t`Borrow Balanced Dollars?` : t`Repay Balanced Dollars?`}
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
            {`${storedModalValues.amount} ${_inputAmount?.currency.symbol}`}
          </Typography>

          <Flex my={4}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">
                <Trans>Before</Trans>
              </Typography>
              <Typography variant="p" textAlign="center">
                {storedModalValues.before} bnUSD
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">
                <Trans>After</Trans>
              </Typography>
              <Typography variant="p" textAlign="center">
                {storedModalValues.after} bnUSD
              </Typography>
            </Box>
          </Flex>

          {action === XLoanAction.BORROW && (
            <Typography textAlign="center">
              <Trans>Includes a fee of {originationFee.dp(2).toFormat()} bnUSD.</Trans>
            </Typography>
          )}

          {interestRate && interestRate.isGreaterThan(0) && action === XLoanAction.BORROW && (
            <Typography textAlign="center">
              <Trans>
                Your loan will increase at a rate of {`${interestRate.times(100).toFixed(2)}%`.replace('.00%', '%')} per
                year.
              </Trans>
            </Typography>
          )}

          <Typography textAlign="center">
            <Trans>You'll also pay</Trans> <strong>{formattedXCallFee}</strong> <Trans>to transfer cross-chain.</Trans>
          </Typography>

          {currentXTransaction && <XTransactionState xTransaction={currentXTransaction} />}

          <Flex justifyContent="center" mt="20px" pt="20px" className="border-top">
            <>
              <TextButton onClick={handleDismiss}>
                <Trans>Cancel</Trans>
              </TextButton>

              {isWrongChain && !isProcessing ? (
                <StyledButton onClick={handleSwitchChain}>
                  <Trans>Switch to {xChainMap[activeChain].name}</Trans>
                </StyledButton>
              ) : isProcessing ? (
                <>
                  <StyledButton disabled $loading>
                    {action === XLoanAction.BORROW ? (
                      <Trans>Borrow in progress</Trans>
                    ) : (
                      <Trans>Repay in progress</Trans>
                    )}
                  </StyledButton>
                </>
              ) : (
                <StyledButton onClick={handleXLoanAction} disabled={!gasChecker.hasEnoughGas}>
                  {action === XLoanAction.BORROW ? <Trans>Borrow</Trans> : <Trans>Repay</Trans>}
                </StyledButton>
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

export default XLoanModal;
