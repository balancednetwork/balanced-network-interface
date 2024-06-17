import React, { useMemo } from 'react';

import { Currency, CurrencyAmount, Token, TradeType } from '@balancednetwork/sdk-core';
import { Trade } from '@balancednetwork/v1-sdk';
import { Trans, t } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { Box, Flex } from 'rebass';

import { XChainId, XToken } from 'app/pages/trade/bridge/types';
import { getNetworkDisplayName } from 'app/pages/trade/bridge/utils';
import { Typography } from 'app/theme';
import { useChangeShouldLedgerSign, useShouldLedgerSign, useSwapSlippageTolerance } from 'store/application/hooks';
import { Field } from 'store/loan/reducer';
import { formatBigNumber, shortenAddress } from 'utils';
import { MODAL_ID, modalActions, useModalStore } from 'app/pages/trade/bridge/_zustand/useModalStore';
import {
  XTransactionUpdater,
  useXTransactionStore,
  xTransactionActions,
} from 'app/pages/trade/bridge/_zustand/useXTransactionStore';
import { useCreateWalletXService } from 'app/pages/trade/bridge/_zustand/useXServiceStore';
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
import { useDerivedLoanInfo, useLoanRecipientNetwork } from 'store/loan/hooks';
import { useCollateralType } from 'store/collateral/hooks';

export enum XLoanAction {
  BORROW = 'BORROW',
  REPAY = 'REPAY',
}

type XLoanModalProps = {
  account: string | undefined;
  sourceChain: XChainId;
  action: XLoanAction;
  originationFee: BigNumber;
  bnUSDAmount?: CurrencyAmount<Token>;
  interestRate?: BigNumber;
};

export const presenceVariants = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 },
};

const XLoanModal = ({ account, bnUSDAmount, sourceChain, action, originationFee, interestRate }: XLoanModalProps) => {
  useModalStore();
  const { currentId } = useXTransactionStore();
  const currentXTransaction = xTransactionActions.get(currentId);
  const isProcessing: boolean = currentId !== null;
  const receiverNetwork = useLoanRecipientNetwork();
  const { borrowedAmount, parsedAmount, direction } = useDerivedLoanInfo();
  const collateralType = useCollateralType();

  useCreateWalletXService(sourceChain);

  const { xCallFee, formattedXCallFee } = useXCallFee(sourceChain, receiverNetwork);

  const xChain = xChainMap[sourceChain];
  const _inputAmount = useMemo(() => {
    return bnUSDAmount ? bnUSDAmount : undefined;
  }, [bnUSDAmount]);

  const handleDismiss = () => {
    modalActions.closeModal(MODAL_ID.XLOAN_CONFIRM_MODAL);
    setTimeout(() => {
      xTransactionActions.reset();
    }, 500);
  };

  const handleXCollateralAction = async () => {
    if (!account) return;
    if (!xCallFee) return;
    if (!_inputAmount) return;
    if (!collateralType) return;

    const xTransactionInput: XTransactionInput = {
      type: XTransactionType.BORROW,
      direction,
      account,
      inputAmount: _inputAmount,
      usedCollateral: collateralType,
      xCallFee,
    };

    await xTransactionActions.executeTransfer(xTransactionInput);
  };

  const gasChecker = useXCallGasChecker(sourceChain);

  // switch chain between evm chains
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
      <Modal isOpen={modalActions.isModalOpen(MODAL_ID.XLOAN_CONFIRM_MODAL)} onDismiss={handleDismiss}>
        <ModalContent noMessages={isProcessing} noCurrencyBalanceErrorMessage>
          <Typography textAlign="center" mb="5px">
            {action === XLoanAction.BORROW ? t`Borrow Balanced Dollars?` : t`Repay Balanced Dollars?`}
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
            {`${_inputAmount?.toFixed(2, { groupSeparator: ',' })} ${_inputAmount?.currency.symbol}`}
          </Typography>

          <Flex my={4}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">
                <Trans>Before</Trans>
              </Typography>
              <Typography variant="p" textAlign="center">
                {borrowedAmount.dp(2).toFormat()} bnUSD
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">
                <Trans>After</Trans>
              </Typography>
              <Typography variant="p" textAlign="center">
                {parsedAmount[Field.LEFT].dp(2).toFormat()} bnUSD
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

              {isWrongChain ? (
                <StyledButton onClick={handleSwitchChain}>
                  <Trans>Switch Network</Trans>
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
                <StyledButton onClick={handleXCollateralAction} disabled={!gasChecker.hasEnoughGas}>
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
