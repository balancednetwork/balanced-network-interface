import React, { useCallback, useEffect } from 'react';

import {
  ICON_XCALL_NETWORK_ID,
  XTransactionStatus,
  getNetworkDisplayName,
  getXChainType,
  useXAccount,
  useXCallFee,
  useXStakeLPToken,
  useXTransactionStore,
  useXUnstakeLPToken,
} from '@balancednetwork/xwagmi';
import { Trans, t } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { Box, Flex } from 'rebass/styled-components';

import { Button, TextButton } from '@/app/components/Button';
import Modal from '@/app/components/Modal';
import ModalContent from '@/app/components/ModalContent';
import { Typography } from '@/app/theme';
import { ZERO } from '@/constants/index';
import { Pool } from '@/hooks/useV2Pairs';
import { showMessageOnBeforeUnload } from '@/utils/messages';

import { StyledButton } from '@/app/components/Button/StyledButton';
import XTransactionState from '@/app/components/XTransactionState';
import { useEvmSwitchChain } from '@/hooks/useEvmSwitchChain';
import useXCallGasChecker from '@/hooks/useXCallGasChecker';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';

export default function StakeLPModal({
  isOpen,
  onClose,
  pool,
  beforeAmount,
  afterAmount,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  pool: Pool;
  beforeAmount: BigNumber;
  afterAmount: BigNumber;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  const { pair } = pool;
  const { formattedXCallFee } = useXCallFee(pool.xChainId, ICON_XCALL_NETWORK_ID);
  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(pool.xChainId);
  const gasChecker = useXCallGasChecker(pool.xChainId, undefined);
  const xStakeLPToken = useXStakeLPToken();
  const xUnstakeLPToken = useXUnstakeLPToken();
  const xAccount = useXAccount(getXChainType(pool.xChainId));

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
      onSuccess?.();
      setIsPending(false);
      setPendingTx('');
    }, 500);
  }, [onClose, onSuccess]);

  const slowDismiss = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['pools'] });

    setTimeout(() => {
      handleDismiss();
    }, 2000);
  }, [handleDismiss, queryClient]);

  useEffect(() => {
    if (isExecuted) {
      slowDismiss();
    }
  }, [isExecuted, slowDismiss]);

  const differenceAmount = afterAmount.minus(beforeAmount?.toFixed() || ZERO);
  const shouldStake = differenceAmount.isPositive();

  const handleConfirm = async () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    try {
      setIsPending(true);

      const decimals = Math.ceil((pair.token0.decimals + pair.token1.decimals) / 2);

      let txHash;
      if (shouldStake) {
        txHash = await xStakeLPToken(
          xAccount.address,
          pool.poolId,
          pool.xChainId,
          differenceAmount.toFixed(),
          decimals,
          pair.token0,
          pair.token1,
        );
      } else {
        txHash = await xUnstakeLPToken(
          xAccount.address,
          pool.poolId,
          pool.xChainId,
          differenceAmount.abs().toFixed(),
          decimals,
          pair.token0,
          pair.token1,
        );
      }
      if (txHash) setPendingTx(txHash);
      else setIsPending(false);
    } catch (error) {
      console.error('error', error);
      setIsPending(false);
    }

    window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
  };

  return (
    <Modal isOpen={isOpen} onDismiss={onClose}>
      <ModalContent noMessages>
        <Typography textAlign="center" mb="5px">
          {shouldStake ? 'Stake LP tokens?' : 'Unstake LP tokens?'}
        </Typography>
        <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
          {differenceAmount.abs().dp(2).toFormat()}
        </Typography>
        <Flex my={5}>
          <Box width={1 / 2} className="border-right">
            <Typography textAlign="center">Before</Typography>
            <Typography variant="p" textAlign="center">
              {beforeAmount.dp(2).toFormat()}
            </Typography>
          </Box>

          <Box width={1 / 2}>
            <Typography textAlign="center">After</Typography>
            <Typography variant="p" textAlign="center">
              {afterAmount.dp(2).toFormat()}
            </Typography>
          </Box>
        </Flex>

        {pool.xChainId !== ICON_XCALL_NETWORK_ID && (
          <Flex justifyContent="center" alignItems="center" mb={2} style={{ gap: 4 }}>
            <Typography textAlign="center" as="h3" fontWeight="normal">
              <Trans>Transfer fee: </Trans>
            </Typography>
            <Typography fontWeight="bold">{formattedXCallFee}</Typography>
          </Flex>
        )}

        <Typography textAlign="center">
          {shouldStake ? "You'll earn rewards until you unstake them." : "You'll stop earning rewards from them."}
        </Typography>

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
                  <Trans>{isPending ? 'Close' : 'Cancel'}</Trans>
                </TextButton>
                {isWrongChain ? (
                  <Button onClick={handleSwitchChain} fontSize={14}>
                    <Trans>Switch to</Trans>
                    {` ${getNetworkDisplayName(pool.xChainId)}`}
                  </Button>
                ) : (
                  <StyledButton
                    onClick={handleConfirm}
                    disabled={!gasChecker.hasEnoughGas || isPending || isWrongChain}
                    $loading={isPending}
                  >
                    {isPending ? (shouldStake ? t`Staking` : t`Unstaking`) : shouldStake ? t`Stake` : t`Unstake`}
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
