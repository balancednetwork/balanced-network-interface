import React, { useCallback, useState } from 'react';

import { Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { Box, Flex } from 'rebass';

import { TextButton } from '@/app/components/Button';
import { StyledButton } from '@/app/components/Button/StyledButton';
import Modal from '@/app/components/Modal';
import ModalContent from '@/app/components/ModalContent';
import { Typography } from '@/app/theme';
import CrossIcon from '@/assets/icons/failure.svg';
import TickIcon from '@/assets/icons/tick.svg';
import { useAnalytics } from '@/hooks/useAnalytics';
import { MODAL_ID, modalActions, useModalOpen } from '@/hooks/useModalStore';
import { formatBigNumber } from '@/utils';
import { formatSymbol } from '@/utils/formatter';
import { Currency } from '@balancednetwork/sdk-core';
import { AnimatePresence, motion } from 'framer-motion';

type MigrationModalProps = {
  modalId?: MODAL_ID;
  inputCurrency?: Currency;
  outputCurrency?: Currency;
  inputAmount?: string;
  outputAmount?: string;
  migrationType?: 'bnUSD' | 'ICX';
};

enum MigrationStatus {
  None,
  Migrating,
  Success,
  Failure,
}

const MigrationModal = ({
  modalId = MODAL_ID.MIGRATION_CONFIRM_MODAL,
  inputCurrency,
  outputCurrency,
  inputAmount,
  outputAmount,
  migrationType = 'bnUSD',
}: MigrationModalProps) => {
  const modalOpen = useModalOpen(modalId);
  const { track } = useAnalytics();
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus>(MigrationStatus.None);
  const [error, setError] = useState<string | null>(null);

  const handleDismiss = useCallback(() => {
    modalActions.closeModal(modalId);
    setTimeout(() => {
      setMigrationStatus(MigrationStatus.None);
      setError(null);
    }, 500);
  }, [modalId]);

  const slowDismiss = useCallback(() => {
    setTimeout(() => {
      handleDismiss();
    }, 2000);
  }, [handleDismiss]);

  const handleMigration = async () => {
    if (!inputCurrency || !outputCurrency || !inputAmount || !outputAmount) {
      return;
    }

    setMigrationStatus(MigrationStatus.Migrating);

    try {
      // TODO: Implement actual migration logic here
      // This is a placeholder for the migration implementation
      console.log('Starting migration:', {
        inputCurrency: inputCurrency.symbol,
        outputCurrency: outputCurrency.symbol,
        inputAmount,
        outputAmount,
        migrationType,
      });

      // Simulate migration process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // For now, always succeed
      setMigrationStatus(MigrationStatus.Success);
      slowDismiss();

      // Track migration event
      track('swap_standard', {
        inputCurrency: inputCurrency.symbol,
        outputCurrency: outputCurrency.symbol,
        inputAmount,
        outputAmount,
        migrationType,
      });
    } catch (e) {
      console.error('Migration error', e);
      setError(e instanceof Error ? e.message : 'An unexpected error occurred');
      setMigrationStatus(MigrationStatus.Failure);
    }
  };

  const isProcessing = migrationStatus === MigrationStatus.Migrating;

  return (
    <Modal isOpen={modalOpen} onDismiss={handleDismiss}>
      <ModalContent noMessages={isProcessing}>
        <Typography textAlign="center" mb="5px" as="h3" fontWeight="normal">
          <Trans>
            Migrate {formatSymbol(inputCurrency?.symbol)} to {formatSymbol(outputCurrency?.symbol)}?
          </Trans>
        </Typography>

        <Typography variant="p" fontWeight="bold" textAlign="center" color="text">
          <Trans>{migrationType === 'bnUSD' ? 'bnUSD (old <> new)' : 'ICX <> SODA'}</Trans>
        </Typography>

        <Flex my={4}>
          <Box width={1 / 2} className="border-right">
            <Typography textAlign="center">
              <Trans>From</Trans>
            </Typography>
            <Typography variant="p" textAlign="center" py="5px">
              {inputAmount} {inputCurrency?.symbol}
            </Typography>
          </Box>

          <Box width={1 / 2}>
            <Typography textAlign="center">
              <Trans>To</Trans>
            </Typography>
            <Typography variant="p" textAlign="center" py="5px">
              {outputAmount} {outputCurrency?.symbol}
            </Typography>
          </Box>
        </Flex>

        <AnimatePresence>
          {migrationStatus === MigrationStatus.Failure && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Box pt={3}>
                <Flex pt={3} alignItems="center" justifyContent="center" flexDirection="column" className="border-top">
                  <Typography mb={4}>
                    <Trans>Migration failed</Trans>
                  </Typography>
                  {error ? (
                    <Typography maxWidth="320px" color="alert" textAlign="center">
                      {error}
                    </Typography>
                  ) : (
                    <CrossIcon width={20} height={20} />
                  )}
                </Flex>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {migrationStatus !== MigrationStatus.Success && (
            <motion.div
              key={'migration-actions'}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <Flex justifyContent="center" mt={4} pt={4} className="border-top">
                <TextButton onClick={handleDismiss}>
                  <Trans>{isProcessing || migrationStatus === MigrationStatus.Failure ? 'Close' : 'Cancel'}</Trans>
                </TextButton>

                {migrationStatus !== MigrationStatus.Failure && (
                  <StyledButton
                    onClick={handleMigration}
                    disabled={isProcessing || !inputCurrency || !outputCurrency || !inputAmount || !outputAmount}
                  >
                    {isProcessing ? <Trans>Migrating...</Trans> : <Trans>Migrate</Trans>}
                  </StyledButton>
                )}
              </Flex>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {migrationStatus === MigrationStatus.Success && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Box pt={3}>
                <Flex pt={3} alignItems="center" justifyContent="center" flexDirection="column" className="border-top">
                  <Typography mb={4}>
                    <Trans>Migration completed</Trans>
                  </Typography>
                  <TickIcon width={20} height={20} />
                </Flex>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </ModalContent>
    </Modal>
  );
};

export default MigrationModal;
