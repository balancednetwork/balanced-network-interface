import React, { useCallback, useEffect, useMemo } from 'react';

import { Trans, t } from '@lingui/macro';
import { AnimatePresence, motion } from 'framer-motion';
import { Flex } from 'rebass/styled-components';

import { Button, TextButton } from '@/app/components/Button';
import { StyledButton } from '@/app/components/Button/StyledButton';
import Modal from '@/app/components/Modal';
import ModalContent from '@/app/components/ModalContent';
import XTransactionState from '@/app/components/XTransactionState';
import { Typography } from '@/app/theme';
import { useEvmSwitchChain } from '@/hooks/useEvmSwitchChain';
import useXCallGasChecker from '@/hooks/useXCallGasChecker';
import { useLPRewards } from '@/queries/reward';
import { useSavingsXChainId } from '@/store/savings/hooks';
import { showMessageOnBeforeUnload } from '@/utils/messages';
import {
  ICON_XCALL_NETWORK_ID,
  XTransactionStatus,
  getNetworkDisplayName,
  getXChainType,
  useXAccount,
  useXCallFee,
  useXClaimRewards,
  useXTransactionStore,
} from '@balancednetwork/xwagmi';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ClaimLPRewardsModal({ isOpen, onClose }: ModalProps) {
  const savingsXChainId = useSavingsXChainId();

  const { data: lpRewards, refetch } = useLPRewards();
  const rewards = useMemo(() => lpRewards?.[savingsXChainId]?.rewards, [lpRewards, savingsXChainId]);

  const [isPending, setIsPending] = React.useState(false);
  const [pendingTx, setPendingTx] = React.useState('');
  const currentXTransaction = useXTransactionStore(state => state.transactions[pendingTx]);

  const isExecuted = React.useMemo(
    () =>
      currentXTransaction?.status === XTransactionStatus.success ||
      currentXTransaction?.status === XTransactionStatus.failure,
    [currentXTransaction],
  );

  const handleDismiss = useCallback(() => {
    onClose();
    setTimeout(() => {
      setIsPending(false);
      setPendingTx('');
    }, 500);
  }, [onClose]);

  const slowDismiss = useCallback(() => {
    setTimeout(() => {
      handleDismiss();
    }, 2000);
  }, [handleDismiss]);

  useEffect(() => {
    if (isExecuted) {
      slowDismiss();
      refetch();
    }
  }, [isExecuted, slowDismiss, refetch]);

  const xAccount = useXAccount(getXChainType(savingsXChainId));
  const xClaimRewards = useXClaimRewards();

  const handleClaim = async () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);
    try {
      setIsPending(true);
      const txHash = await xClaimRewards(xAccount.address, savingsXChainId);
      if (txHash) setPendingTx(txHash);
      else setIsPending(false);
    } catch (error) {
      console.error('error', error);
      setIsPending(false);
    }

    window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
  };

  const { formattedXCallFee } = useXCallFee(savingsXChainId, ICON_XCALL_NETWORK_ID);
  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(savingsXChainId);
  const gasChecker = useXCallGasChecker(savingsXChainId, undefined);
  return (
    <Modal isOpen={isOpen} onDismiss={onClose}>
      <ModalContent noMessages>
        <Typography textAlign="center" mb={1}>
          <Trans>Claim liquidity rewards?</Trans>
        </Typography>

        <Flex flexDirection="column" alignItems="center" mt={2}>
          {rewards?.map((reward, index) => (
            <Typography key={index} variant="p">
              {`${reward.toFixed(2, { groupSeparator: ',' })}`}{' '}
              <Typography as="span" color="text1">
                {reward.currency.symbol}
              </Typography>
            </Typography>
          ))}
        </Flex>

        {savingsXChainId !== ICON_XCALL_NETWORK_ID && (
          <Flex justifyContent="center" alignItems="center" mt={2} style={{ gap: 4 }}>
            <Typography textAlign="center" as="h3" fontWeight="normal">
              <Trans>Transfer fee: </Trans>
            </Typography>
            <Typography fontWeight="bold">{formattedXCallFee}</Typography>
          </Flex>
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
              <Flex justifyContent="center" mt={4} pt={4} className="border-top">
                <TextButton onClick={onClose} fontSize={14}>
                  <Trans>Not now</Trans>
                </TextButton>
                {isWrongChain ? (
                  <Button onClick={handleSwitchChain} fontSize={14}>
                    <Trans>Switch to</Trans>
                    {` ${getNetworkDisplayName(savingsXChainId)}`}
                  </Button>
                ) : (
                  <StyledButton
                    onClick={handleClaim}
                    disabled={!gasChecker.hasEnoughGas || isPending || isWrongChain}
                    $loading={isPending}
                  >
                    {isPending ? t`Claiming` : t`Claim`}
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
  );
}
