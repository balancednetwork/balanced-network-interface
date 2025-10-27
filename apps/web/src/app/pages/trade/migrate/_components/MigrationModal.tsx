import React, { useCallback, useState, useMemo } from 'react';

import { Trans, t } from '@lingui/macro';
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
import { useMigrationAllowance } from '@/hooks/useMigrationAllowance';
import { MODAL_ID, modalActions, useModalOpen } from '@/hooks/useModalStore';
import { useSpokeProvider } from '@/hooks/useSpokeProvider';
import { sodax } from '@/lib/sodax';
import { formatBigNumber, shortenAddress } from '@/utils';
import { formatBalance, formatSymbol } from '@/utils/formatter';
import { getNetworkDisplayName } from '@/utils/xTokens';
import { Currency, XChainId } from '@balancednetwork/sdk-core';
import { getXChainType, useXAccount, xChainMap, xTokenMap } from '@balancednetwork/xwagmi';
import {
  BalnMigrateParams,
  IEvmWalletProvider,
  IconSpokeProvider,
  IcxCreateRevertMigrationParams,
  IcxMigrateParams,
  IcxTokenType,
  SonicSpokeProvider,
  SpokeChainId,
  UnifiedBnUSDMigrateParams,
  getSupportedSolverTokens,
} from '@sodax/sdk';
import { AnimatePresence, motion } from 'framer-motion';

type MigrationModalProps = {
  modalId?: MODAL_ID;
  inputCurrency?: Currency;
  outputCurrency?: Currency;
  inputAmount?: string;
  outputAmount?: string;
  migrationType?: 'bnUSD' | 'ICX' | 'BALN';
  sourceChain?: XChainId;
  receiverChain?: XChainId;
  revert: boolean;
  showSolanaWarning?: boolean;
  lockupPeriod?: number; // Lockup period in seconds for BALN migration
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
  showSolanaWarning = false,
  lockupPeriod,
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

  /**
   * Helper function to get bnUSD addresses based on migration direction
   * @param isRevert - Whether this is a revert migration (new -> old) or forward migration (old -> new)
   * @returns Object containing source and destination bnUSD token addresses
   */
  const getBnUSDAddresses = useCallback(
    (isRevert: boolean) => {
      const srcSymbol = isRevert ? 'bnUSD' : 'bnUSD(old)';
      const dstSymbol = isRevert ? 'bnUSD(old)' : 'bnUSD';

      return {
        srcbnUSD: xTokenMap[sourceChain as SpokeChainId]
          ?.find(token => token.symbol === srcSymbol)
          ?.address.replace(
            '0x3917a812fe4a6d6bc779c5ab53f8a80ba741f8af04121193fc44e0f662e2ceb::balanced_dollar::BALANCED_DOLLAR',
            '0x03917a812fe4a6d6bc779c5ab53f8a80ba741f8af04121193fc44e0f662e2ceb::balanced_dollar::BALANCED_DOLLAR',
          ),
        dstbnUSD: xTokenMap[receiverChain as SpokeChainId]
          ?.find(token => token.symbol === dstSymbol)
          ?.address.replace(
            '0x3917a812fe4a6d6bc779c5ab53f8a80ba741f8af04121193fc44e0f662e2ceb::balanced_dollar::BALANCED_DOLLAR',
            '0x03917a812fe4a6d6bc779c5ab53f8a80ba741f8af04121193fc44e0f662e2ceb::balanced_dollar::BALANCED_DOLLAR',
          ),
      };
    },
    [sourceChain, receiverChain],
  );

  /**
   * Helper function to create bnUSD migration parameters
   * @param isRevert - Whether this is a revert migration
   * @param amount - Amount to migrate as string
   * @param currency - Currency object containing decimals
   * @param toAddress - Destination address
   * @returns UnifiedBnUSDMigrateParams or undefined if invalid inputs
   */
  const createBnUSDMigrationParams = useCallback(
    (
      isRevert: boolean,
      amount: string,
      currency: Currency,
      toAddress: string,
    ): UnifiedBnUSDMigrateParams | undefined => {
      if (!amount || !currency || !toAddress) return undefined;

      const { srcbnUSD, dstbnUSD } = getBnUSDAddresses(isRevert);

      const decimals =
        sourceChain === 'sui' || sourceChain === 'solana' ? 9 : sourceChain === 'stellar' && isRevert ? 7 : 18;

      return {
        srcChainId: sourceChain as SpokeChainId,
        dstChainId: receiverChain as SpokeChainId,
        srcbnUSD,
        dstbnUSD,
        amount: BigInt(new BigNumber(amount).times(10 ** decimals).toFixed()),
        to: toAddress as `0x${string}`,
      };
    },
    [sourceChain, receiverChain, getBnUSDAddresses],
  );

  /**
   * Helper function to create ICX migration parameters
   * @param amount - Amount to migrate as string
   * @param currency - Currency object containing decimals
   * @param toAddress - Destination address
   * @returns IcxMigrateParams object
   */
  const createIcxMigrationParams = useCallback(
    (amount: string, currency: Currency, toAddress: string): IcxMigrateParams => {
      return {
        address: 'cx0000000000000000000000000000000000000000' as IcxTokenType,
        amount: BigInt(new BigNumber(amount).times(10 ** currency.decimals).toFixed()),
        to: toAddress as `0x${string}`,
      };
    },
    [],
  );

  /**
   * Helper function to create BALN migration parameters
   * @param amount - Amount to migrate as string
   * @param currency - Currency object containing decimals
   * @param toAddress - Destination address
   * @param lockupPeriodSeconds - Lockup period in seconds
   * @returns BalnMigrateParams object
   */
  const createBalnMigrationParams = useCallback(
    (amount: string, currency: Currency, toAddress: string, lockupPeriodSeconds: number): BalnMigrateParams => {
      return {
        amount: BigInt(new BigNumber(amount).times(10 ** currency.decimals).toFixed()),
        lockupPeriod: lockupPeriodSeconds, // Use seconds directly
        to: toAddress as `0x${string}`,
        stake: false,
      };
    },
    [],
  );

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
      return createBnUSDMigrationParams(true, inputAmount, inputCurrency, accountReceiver.address);
    }

    if (migrationType === 'BALN') {
      // For BALN migration, we'll need to implement the BALN-specific logic
      // This is a placeholder for now
      return undefined;
    }
  }, [revert, migrationType, inputAmount, inputCurrency, accountReceiver?.address, createBnUSDMigrationParams]);

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
        const migrationParams = createBnUSDMigrationParams(revert, inputAmount, inputCurrency, accountReceiver.address);

        if (!migrationParams) {
          throw new Error('Failed to create migration parameters');
        }

        const result = await sodax.migration.migratebnUSD(migrationParams, sourceSpokeProvider);
        if (result.ok) {
          const [spokeTxHash, hubTxHash] = result.value;
        } else {
          throw result.error;
        }
      } else if (migrationType === 'ICX') {
        if (!revert) {
          const migrationParams = createIcxMigrationParams(inputAmount, inputCurrency, accountReceiver.address);
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
      } else if (migrationType === 'BALN') {
        if (!lockupPeriod && lockupPeriod !== 0) {
          throw new Error('Lockup period is required for BALN migration');
        }

        const migrationParams = createBalnMigrationParams(
          inputAmount,
          inputCurrency,
          accountReceiver.address,
          lockupPeriod,
        );

        const result = await sodax.migration.migrateBaln(
          migrationParams,
          sourceSpokeProvider as IconSpokeProvider,
          30000, // 30 second timeout
        );

        if (result.ok) {
          console.log('BALN migration successful!');
        } else {
          throw result.error;
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
      <ModalContent noMessages={true}>
        <Typography textAlign="center" mb="5px" as="h3" fontWeight="normal">
          <Trans>
            Migrate {formatSymbol(inputCurrency?.symbol)} to {formatSymbol(outputCurrency?.symbol)}?
          </Trans>
        </Typography>

        <Typography variant="p" fontWeight="bold" textAlign="center" color="text">
          {migrationType === 'BALN' && lockupPeriod !== undefined
            ? (() => {
                // Calculate the multiplier based on lockup period
                let multiplier = 0.75; // Default 6 months
                if (lockupPeriod === 0)
                  multiplier = 0.5; // No lockup
                else if (lockupPeriod === 6 * 30 * 24 * 60 * 60)
                  multiplier = 0.75; // 6 months
                else if (lockupPeriod === 12 * 30 * 24 * 60 * 60)
                  multiplier = 1.0; // 12 months
                else if (lockupPeriod === 18 * 30 * 24 * 60 * 60)
                  multiplier = 1.25; // 18 months
                else if (lockupPeriod === 24 * 30 * 24 * 60 * 60) multiplier = 1.5; // 24 months

                return `1 ${inputCurrency?.symbol} = ${multiplier} ${outputCurrency?.symbol}`;
              })()
            : `1 ${inputCurrency?.symbol} = 1 ${outputCurrency?.symbol}`}
        </Typography>

        {migrationType === 'BALN' && lockupPeriod !== undefined && lockupPeriod > 0 && (
          <Typography textAlign="center" color="text2" mt={'1px'}>
            {t`Lock-up time: ${(() => {
              if (lockupPeriod === 0) return 'No lock-up';
              else if (lockupPeriod === 6 * 30 * 24 * 60 * 60) return '6 months';
              else if (lockupPeriod === 12 * 30 * 24 * 60 * 60) return '12 months';
              else if (lockupPeriod === 18 * 30 * 24 * 60 * 60) return '18 months';
              else if (lockupPeriod === 24 * 30 * 24 * 60 * 60) return '24 months';
              else return '6 months'; // Default fallback
            })()}`}
          </Typography>
        )}

        <Flex mt={4}>
          <Box width={1 / 2} className="border-right">
            <Typography textAlign="center">
              <Trans>Send</Trans>
            </Typography>
            <Typography variant="p" textAlign="center" py="5px">
              {formatBalance(inputAmount, '1')} {inputCurrency?.symbol}
            </Typography>
            <Typography textAlign="center">
              <Trans>{sourceChain && getNetworkDisplayName(sourceChain)}</Trans>
            </Typography>
            <Typography textAlign="center">
              <Trans>{accountSource?.address && shortenAddress(accountSource.address, 5)}</Trans>
            </Typography>
          </Box>

          <Box width={1 / 2}>
            <Typography textAlign="center">
              <Trans>Receive</Trans>
            </Typography>
            <Typography variant="p" textAlign="center" py="5px">
              {formatBalance(outputAmount, '1')} {outputCurrency?.symbol}
            </Typography>
            <Typography textAlign="center">
              <Trans>{receiverChain && getNetworkDisplayName(receiverChain)}</Trans>
            </Typography>
            <Typography textAlign="center">
              <Trans>{accountReceiver?.address && shortenAddress(accountReceiver.address, 5)}</Trans>
            </Typography>
          </Box>
        </Flex>

        {migrationType === 'BALN' && lockupPeriod !== undefined && lockupPeriod > 0 && (
          <Box mt={4}>
            <Typography textAlign="center" color="text2">
              {t`You'll receive your SODA tokens on `}
              <strong style={{ color: 'white', paddingLeft: '5px' }}>
                {(() => {
                  const now = new Date();
                  const unlockTime = new Date(now.getTime() + lockupPeriod * 1000);
                  return unlockTime.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  });
                })()}
              </strong>
              .
            </Typography>
            {lockupPeriod !== 0 && (
              <Typography mt={4} textAlign="center" color="text2">
                After you migrate, you can stake your locked SODA to earn rewards while you wait.
              </Typography>
            )}
          </Box>
        )}

        {showSolanaWarning && (
          <Typography textAlign="center" mt="30px">
            <Trans>Solana may deduct a "new token" fee of 0.50 {formatSymbol(outputCurrency?.symbol)}.</Trans>
          </Typography>
        )}

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
