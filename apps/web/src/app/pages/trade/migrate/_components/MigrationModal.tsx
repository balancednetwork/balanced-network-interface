import React, { useCallback, useState, useMemo } from 'react';

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
import { ApprovalState } from '@/hooks/useApproveCallback';
import { useEvmSwitchChain } from '@/hooks/useEvmSwitchChain';
import { MODAL_ID, modalActions, useModalOpen } from '@/hooks/useModalStore';
import { useMigrationAllowance } from '@/hooks/useMigrationAllowance';
import { useSpokeProvider } from '@/hooks/useSpokeProvider';
import { sodax } from '@/lib/sodax';
import { formatBigNumber } from '@/utils';
import { formatSymbol } from '@/utils/formatter';
import { Currency, XChainId } from '@balancednetwork/sdk-core';
import { AnimatePresence, motion } from 'framer-motion';
import {
  getSupportedSolverTokens,
  IconSpokeProvider,
  IcxCreateRevertMigrationParams,
  IcxMigrateParams,
  IcxTokenType,
  IEvmWalletProvider,
  SonicSpokeProvider,
  SpokeChainId,
  UnifiedBnUSDMigrateParams,
} from '@sodax/sdk';
import { getXChainType, useXAccount, xChainMap, xTokenMap } from '@balancednetwork/xwagmi';

type MigrationModalProps = {
  modalId?: MODAL_ID;
  inputCurrency?: Currency;
  outputCurrency?: Currency;
  inputAmount?: string;
  outputAmount?: string;
  migrationType?: 'bnUSD' | 'ICX';
  sourceChain?: XChainId;
  receiverChain?: XChainId;
  revert: boolean;
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
  sourceChain,
  receiverChain,
  migrationType = 'bnUSD',
  revert,
}: MigrationModalProps) => {
  const modalOpen = useModalOpen(modalId);
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
    }, 3000);
  }, [handleDismiss]);

  const accountSource = useXAccount(getXChainType(sourceChain));
  const accountReceiver = useXAccount(getXChainType(receiverChain));
  const sourceSpokeProvider = useSpokeProvider(sourceChain as SpokeChainId);

  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(sourceChain!);

  // Create revert params for ICX revert migration
  const revertParams: IcxCreateRevertMigrationParams | UnifiedBnUSDMigrateParams | undefined = useMemo(() => {
    if (!revert || !inputAmount || !inputCurrency || !accountReceiver?.address) {
      return undefined;
    }

    if (migrationType === 'ICX') {
      return {
        amount: BigInt(new BigNumber(inputAmount).times(10 ** inputCurrency.decimals).toFixed()),
        to: accountReceiver.address as `hx${string}`,
      } satisfies IcxCreateRevertMigrationParams;
    }

    if (migrationType === 'bnUSD') {
      const srcbnUSD = xTokenMap[sourceChain as SpokeChainId].find(token => token.symbol === 'bnUSD')?.address;
      const dstbnUSD = xTokenMap[receiverChain as SpokeChainId].find(token => token.symbol === 'bnUSD (old)')?.address;
      return {
        srcChainId: sourceChain as SpokeChainId,
        dstChainId: receiverChain as SpokeChainId,
        srcbnUSD,
        dstbnUSD,
        amount: BigInt(new BigNumber(inputAmount).times(10 ** inputCurrency.decimals).toFixed()),
        to: accountReceiver.address as `0x${string}`,
      } satisfies UnifiedBnUSDMigrateParams;
    }
  }, [revert, migrationType, inputAmount, inputCurrency, accountReceiver?.address, sourceChain, receiverChain]);

  // Use allowance hook for ICX revert migration
  const {
    approve: approveAllowance,
    approvalState,
    isApproving,
    hasAllowance,
  } = useMigrationAllowance(revertParams, sourceChain as SpokeChainId);

  const shouldApprove = approvalState !== ApprovalState.UNKNOWN && approvalState !== ApprovalState.APPROVED;

  const handleApprove = async () => {
    if (!revertParams) {
      return;
    }

    try {
      const result = await approveAllowance();
      if (!result.ok) {
        throw result.error;
      }
    } catch (error) {
      console.error('Approval error:', error);
      setError(error instanceof Error ? error.message : 'Approval failed');
    }
  };

  const handleMigration = async () => {
    if (
      !inputCurrency ||
      !outputCurrency ||
      !inputAmount ||
      !outputAmount ||
      !accountSource?.address ||
      !accountReceiver?.address ||
      !sourceSpokeProvider
    ) {
      return;
    }

    setMigrationStatus(MigrationStatus.Migrating);

    try {
      if (migrationType === 'bnUSD') {
        let srcbnUSD: string;
        let dstbnUSD: string;

        if (!revert) {
          srcbnUSD = xTokenMap[sourceChain as SpokeChainId].find(token => token.symbol === 'bnUSD (old)')?.address;
          dstbnUSD = xTokenMap[receiverChain as SpokeChainId].find(token => token.symbol === 'bnUSD')?.address;
        } else {
          srcbnUSD = xTokenMap[sourceChain as SpokeChainId].find(token => token.symbol === 'bnUSD')?.address;
          dstbnUSD = xTokenMap[receiverChain as SpokeChainId].find(token => token.symbol === 'bnUSD (old)')?.address;
        }

        const migrationParams: UnifiedBnUSDMigrateParams = {
          srcChainId: sourceChain as SpokeChainId,
          dstChainId: receiverChain as SpokeChainId,
          srcbnUSD,
          dstbnUSD,
          amount: BigInt(new BigNumber(inputAmount).times(10 ** inputCurrency.decimals).toFixed()),
          to: accountReceiver.address as `0x${string}`,
        };

        setMigrationStatus(MigrationStatus.Migrating);
        const result = await sodax.migration.migratebnUSD(migrationParams, sourceSpokeProvider);
        if (result.ok) {
          const [spokeTxHash, hubTxHash] = result.value;
        } else {
          throw result.error;
        }
      } else if (migrationType === 'ICX') {
        if (!revert) {
          setMigrationStatus(MigrationStatus.Migrating);
          const migrationParams: IcxMigrateParams = {
            address: 'cx0000000000000000000000000000000000000000' as IcxTokenType,
            amount: BigInt(new BigNumber(inputAmount).times(10 ** inputCurrency.decimals).toFixed()),
            to: accountReceiver.address as `0x${string}`,
          };
          const result = await sodax.migration.migrateIcxToSoda(
            migrationParams,
            sourceSpokeProvider as IconSpokeProvider,
          );
          if (result.ok) {
            const [spokeTxHash, hubTxHash] = result.value;
          } else {
            throw result.error;
          }
        } else {
          // For ICX revert migration, allowance is handled separately in the UI
          const result = await sodax.migration.revertMigrateSodaToIcx(
            revertParams as IcxCreateRevertMigrationParams,
            sourceSpokeProvider as SonicSpokeProvider,
          );

          if (result.ok) {
            const [hubTxHash, spokeTxHash] = result.value;
          } else {
            throw result.error;
          }
        }
      }

      setMigrationStatus(MigrationStatus.Success);
      slowDismiss();
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

                {migrationStatus !== MigrationStatus.Failure &&
                  (isWrongChain && sourceChain ? (
                    <StyledButton onClick={handleSwitchChain}>
                      <Trans>Switch to {xChainMap[sourceChain].name}</Trans>
                    </StyledButton>
                  ) : shouldApprove ? (
                    <StyledButton onClick={handleApprove} disabled={isApproving}>
                      {isApproving ? 'Approving...' : hasAllowance ? 'Approved' : 'Approve'}
                    </StyledButton>
                  ) : (
                    <StyledButton
                      onClick={handleMigration}
                      $loading={isProcessing}
                      disabled={isProcessing || !inputCurrency || !outputCurrency || !inputAmount || !outputAmount}
                    >
                      {isProcessing ? <Trans>Migrating...</Trans> : <Trans>Migrate</Trans>}
                    </StyledButton>
                  ))}
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
