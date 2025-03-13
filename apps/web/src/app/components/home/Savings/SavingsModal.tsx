import React, { useCallback, useEffect } from 'react';

import { Trans, t } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { Box, Flex } from 'rebass';

import { Button, TextButton } from '@/app/components/Button';
import Modal from '@/app/components/Modal';
import ModalContent from '@/app/components/ModalContent';
import { Typography } from '@/app/theme';
import { useEvmSwitchChain } from '@/hooks/useEvmSwitchChain';
import useXCallGasChecker from '@/hooks/useXCallGasChecker';
import { useSavingsXChainId } from '@/store/savings/hooks';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import {
  ICON_XCALL_NETWORK_ID,
  XToken,
  XTransactionStatus,
  getNetworkDisplayName,
  getXChainType,
  showMessageOnBeforeUnload,
  useXAccount,
  useXCallFee,
  useXLockBnUSD,
  useXTransactionStore,
  useXUnlockBnUSD,
  xTokenMapBySymbol,
} from '@balancednetwork/xwagmi';
import { AnimatePresence, motion } from 'framer-motion';
import { StyledButton } from '../../Button/StyledButton';
import XTransactionState from '../../XTransactionState';

const SavingsModal = ({
  isOpen,
  onClose,
  bnUSDDiff,
  lockedAmount,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  bnUSDDiff: BigNumber;
  lockedAmount: CurrencyAmount<XToken> | null | undefined;
  onSuccess?: () => void;
}) => {
  const savingsXChainId = useSavingsXChainId();
  const xAccount = useXAccount(getXChainType(savingsXChainId));

  const [isPending, setIsPending] = React.useState(false);
  const [isSigning, setIsSigning] = React.useState(false);
  const [pendingTx, setPendingTx] = React.useState('');
  const currentXTransaction = useXTransactionStore(state => state.transactions[pendingTx]);

  const isExecuted = React.useMemo(
    () =>
      currentXTransaction?.status === XTransactionStatus.success ||
      currentXTransaction?.status === XTransactionStatus.failure,
    [currentXTransaction],
  );

  const handleDismiss = useCallback(async () => {
    await onSuccess?.();
    onClose();
    setTimeout(() => {
      setIsPending(false);
      setIsSigning(false);
      setPendingTx('');
    }, 500);
  }, [onClose, onSuccess]);

  const slowDismiss = useCallback(() => {
    setTimeout(() => {
      handleDismiss();
    }, 2000);
  }, [handleDismiss]);

  useEffect(() => {
    if (isExecuted) {
      slowDismiss();
    }
  }, [isExecuted, slowDismiss]);

  const xLockBnUSD = useXLockBnUSD();
  const xUnlockBnUSD = useXUnlockBnUSD();
  const shouldDeposit = bnUSDDiff.isGreaterThan(0);

  const handleConfirm = async () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);
    if (xAccount.address) {
      try {
        setIsPending(true);
        setIsSigning(true);
        const bnUSD = xTokenMapBySymbol[savingsXChainId]['bnUSD'];

        let txHash;
        if (shouldDeposit) {
          txHash = await xLockBnUSD(
            xAccount.address,
            CurrencyAmount.fromRawAmount<XToken>(bnUSD, BigInt(bnUSDDiff.multipliedBy(10 ** bnUSD.decimals).toFixed())),
          );
        } else {
          txHash = await xUnlockBnUSD(
            xAccount.address,
            CurrencyAmount.fromRawAmount<XToken>(
              bnUSD,
              BigInt(
                bnUSDDiff
                  .abs()
                  .multipliedBy(10 ** bnUSD.decimals)
                  .toFixed(),
              ),
            ),
          );
        }
        setIsSigning(false);
        if (txHash) setPendingTx(txHash);
        else setIsPending(false);
      } catch (error) {
        setIsPending(false);
        setIsSigning(false);
        console.error('staking/unlocking bnUSD error: ', error);
      } finally {
        window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
      }
    }
  };

  const { formattedXCallFee } = useXCallFee(savingsXChainId, ICON_XCALL_NETWORK_ID);
  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(savingsXChainId);
  const gasChecker = useXCallGasChecker(savingsXChainId, undefined);

  return (
    <>
      <Modal isOpen={isOpen} onDismiss={handleDismiss}>
        <ModalContent noMessages>
          <Typography textAlign="center" mb="5px">
            {shouldDeposit ? t`Deposit bnUSD?` : t`Withdraw bnUSD?`}
          </Typography>
          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
            {`${bnUSDDiff.abs().toFormat(2)} bnUSD`}
          </Typography>
          <Flex my={'25px'}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">Before</Typography>
              <Typography variant="p" textAlign="center">
                {lockedAmount?.toFixed(2, { groupSeparator: ',' }) || 0} bnUSD
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">After</Typography>
              <Typography variant="p" textAlign="center">
                {`${bnUSDDiff.plus(new BigNumber(lockedAmount?.toFixed() ?? 0)).toFixed(2)} bnUSD`}
              </Typography>
            </Box>
          </Flex>

          {savingsXChainId !== ICON_XCALL_NETWORK_ID && (
            <Flex justifyContent="center" alignItems="center" mb={2} style={{ gap: 4 }}>
              <Typography textAlign="center" as="h3" fontWeight="normal">
                <Trans>Transfer fee: </Trans>
              </Typography>
              <Typography fontWeight="bold">{formattedXCallFee}</Typography>
            </Flex>
          )}

          {shouldDeposit && (
            <Typography textAlign="center">
              <Trans>You can withdraw at any time.</Trans>
            </Typography>
          )}

          {currentXTransaction && <XTransactionState xTransaction={currentXTransaction} />}
          <AnimatePresence>
            {((!isExecuted && isPending) || !isPending) && (
              <motion.div
                key={'tx-actions'}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <Flex justifyContent="center" mt={4} pt={4} className="border-top" flexWrap={'wrap'}>
                  <TextButton onClick={handleDismiss} fontSize={14}>
                    <Trans>{isPending && !isSigning ? 'Close' : 'Cancel'}</Trans>
                  </TextButton>

                  {isWrongChain ? (
                    <Button onClick={handleSwitchChain} fontSize={14}>
                      <Trans>Switch to</Trans>
                      {` ${getNetworkDisplayName(savingsXChainId)}`}
                    </Button>
                  ) : (
                    <StyledButton
                      onClick={handleConfirm}
                      disabled={!gasChecker.hasEnoughGas || isPending || isWrongChain}
                      $loading={isPending}
                    >
                      {isPending && !isSigning
                        ? shouldDeposit
                          ? t`Depositing bnUSD`
                          : t`Withdrawing bnUSD`
                        : shouldDeposit
                          ? t`Deposit bnUSD`
                          : t`Withdraw bnUSD`}
                    </StyledButton>
                  )}
                </Flex>
              </motion.div>
            )}
          </AnimatePresence>

          {!gasChecker.hasEnoughGas && (
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

export default SavingsModal;
