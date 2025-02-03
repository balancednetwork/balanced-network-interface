import React, { useCallback, useEffect } from 'react';

import { Currency, CurrencyAmount } from '@balancednetwork/sdk-core';
import { Trans, t } from '@lingui/macro';
import { useQueryClient } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';
import { AnimatePresence, motion } from 'framer-motion';
import { Flex } from 'rebass/styled-components';

import { Button, TextButton } from '@/app/components/Button';
import { StyledButton } from '@/app/components/Button/StyledButton';
import Modal from '@/app/components/Modal';
import ModalContent from '@/app/components/ModalContent';
import XTransactionState from '@/app/components/XTransactionState';
import { Typography } from '@/app/theme';
import { useEvmSwitchChain } from '@/hooks/useEvmSwitchChain';
import { Pool } from '@/hooks/useV2Pairs';
import useXCallGasChecker from '@/hooks/useXCallGasChecker';
import { Field } from '@/store/mint/reducer';
import { formatBigNumber, multiplyCABN } from '@/utils';
import { formatSymbol } from '@/utils/formatter';
import { showMessageOnBeforeUnload } from '@/utils/messages';
import {
  ICON_XCALL_NETWORK_ID,
  XTransactionStatus,
  getNetworkDisplayName,
  getXChainType,
  useXAccount,
  useXCallFee,
  useXRemoveLiquidity,
  useXTransactionStore,
} from '@balancednetwork/xwagmi';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  parsedAmounts: { [field in Field]?: CurrencyAmount<Currency> };
  withdrawPortion: number;
  pool: Pool;
  onSuccess?: () => void;
}

export default function WithdrawLiquidityModal({
  isOpen,
  onClose,
  pool,
  parsedAmounts,
  withdrawPortion,
  onSuccess,
}: ModalProps) {
  const queryClient = useQueryClient();
  const { pair } = pool;

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
      onSuccess && onSuccess();
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
      queryClient.invalidateQueries({ queryKey: ['pools'] });
    }
  }, [isExecuted, slowDismiss, queryClient]);

  const xAccount = useXAccount(getXChainType(pool.xChainId));
  const xRemoveLiquidity = useXRemoveLiquidity();

  const handleWithdraw = async () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    try {
      setIsPending(true);

      const numPortion = new BigNumber(withdrawPortion / 100);
      const withdrawAmount = multiplyCABN(pool.balance, numPortion);
      const txHash = await xRemoveLiquidity(
        xAccount.address,
        pool.poolId,
        pool.xChainId,
        withdrawAmount,
        pair.token0,
        pair.token1,
        parsedAmounts[Field.CURRENCY_A]!,
        parsedAmounts[Field.CURRENCY_B]!,
      );
      if (txHash) setPendingTx(txHash);
      else setIsPending(false);
    } catch (error) {
      console.error('error', error);
      setIsPending(false);
    }

    window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
  };

  const { formattedXCallFee } = useXCallFee(pool.xChainId, ICON_XCALL_NETWORK_ID);
  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(pool.xChainId);
  const gasChecker = useXCallGasChecker(pool.xChainId, undefined);

  return (
    <Modal isOpen={isOpen} onDismiss={onClose}>
      <ModalContent noMessages>
        <Typography textAlign="center" mb={3} as="h3" fontWeight="normal">
          <Trans>Withdraw liquidity?</Trans>
        </Typography>

        <Typography variant="p" fontWeight="bold" textAlign="center">
          {formatBigNumber(new BigNumber(parsedAmounts[Field.CURRENCY_A]?.toFixed() || 0), 'currency')}{' '}
          {formatSymbol(parsedAmounts[Field.CURRENCY_A]?.currency.symbol) || '...'}
        </Typography>

        <Typography variant="p" fontWeight="bold" textAlign="center">
          {formatBigNumber(new BigNumber(parsedAmounts[Field.CURRENCY_B]?.toFixed() || 0), 'currency')}{' '}
          {formatSymbol(parsedAmounts[Field.CURRENCY_B]?.currency.symbol) || '...'}
        </Typography>

        {pool.xChainId !== ICON_XCALL_NETWORK_ID && (
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
                <TextButton onClick={onClose}>
                  <Trans>{isPending ? 'Close' : 'Cancel'}</Trans>
                </TextButton>

                {isWrongChain ? (
                  <Button onClick={handleSwitchChain} fontSize={14}>
                    <Trans>Switch to</Trans>
                    {` ${getNetworkDisplayName(pool.xChainId)}`}
                  </Button>
                ) : (
                  <StyledButton
                    onClick={handleWithdraw}
                    disabled={!gasChecker.hasEnoughGas || isPending || isWrongChain}
                    $loading={isPending}
                  >
                    {isPending ? t`Withdrawing` : t`Withdraw`}
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
