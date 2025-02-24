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
} from '@balancednetwork/xwagmi';
import { Trans, t } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { Flex } from 'rebass/styled-components';

import { Button, TextButton } from '@/app/components/Button';
import Modal from '@/app/components/Modal';
import ModalContent from '@/app/components/ModalContent';
import { Typography } from '@/app/theme';
import { Pool } from '@/hooks/useV2Pairs';
import { showMessageOnBeforeUnload } from '@/utils/messages';

import { StyledButton } from '@/app/components/Button/StyledButton';
import XTransactionState from '@/app/components/XTransactionState';
import { useEvmSwitchChain } from '@/hooks/useEvmSwitchChain';
import useXCallGasChecker from '@/hooks/useXCallGasChecker';
import { formatSymbol } from '@/utils/formatter';
import { AnimatePresence, motion } from 'framer-motion';

export default function SuggestStakingLPModal({
  isOpen,
  onClose,
  pool,
}: {
  isOpen: boolean;
  onClose: () => void;
  pool: Pool;
}) {
  const { pair } = pool;
  const { formattedXCallFee } = useXCallFee(pool.xChainId, ICON_XCALL_NETWORK_ID);
  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(pool.xChainId);
  const gasChecker = useXCallGasChecker(pool.xChainId, undefined);
  const xStakeLPToken = useXStakeLPToken();
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
    }
  }, [isExecuted, slowDismiss]);

  const differenceAmount = new BigNumber(pool.balance.toFixed());

  const handleConfirm = async () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    try {
      setIsPending(true);

      const decimals = Math.ceil((pair.token0.decimals + pair.token1.decimals) / 2);

      const txHash = await xStakeLPToken(
        xAccount.address,
        pool.poolId,
        pool.xChainId,
        differenceAmount.toFixed(),
        decimals,
        pair.token0,
        pair.token1,
      );

      if (txHash) setPendingTx(txHash);
      else setIsPending(false);
    } catch (error) {
      console.error('error', error);
      setIsPending(false);
    }

    window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
  };

  return (
    <Modal isOpen={isOpen} onDismiss={handleDismiss}>
      <ModalContent noMessages>
        <Flex flexDirection="column" justifyContent="center" alignItems="center" style={{ gap: 6 }}>
          <Typography textAlign="center" mb="5px">
            Stake LP tokens?
          </Typography>
          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={16}>
            {differenceAmount.abs().dp(4).toFormat()}
          </Typography>
          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={16}>
            {formatSymbol(pair.token0.symbol)} / {formatSymbol(pair.token1.symbol)}
          </Typography>

          {pool.xChainId !== ICON_XCALL_NETWORK_ID && (
            <Flex justifyContent="center" alignItems="center" mt={2} style={{ gap: 4 }}>
              <Typography textAlign="center" as="h3" fontWeight="normal">
                <Trans>Transfer fee: </Trans>
              </Typography>
              <Typography fontWeight="bold">{formattedXCallFee}</Typography>
            </Flex>
          )}

          <Typography textAlign="center">
            Required to earn rewards, but you can stake/unstake from the Liquidity Pools section later.
          </Typography>
        </Flex>
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
                <TextButton onClick={handleDismiss} fontSize={14}>
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
                    {isPending ? t`Staking` : t`Stake LP tokens`}
                  </StyledButton>
                )}
              </Flex>
            </motion.div>
          )}
        </AnimatePresence>
        {!isPending && !gasChecker.hasEnoughGas && (
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
