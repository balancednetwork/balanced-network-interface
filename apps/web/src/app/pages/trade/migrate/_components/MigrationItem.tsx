import { Button, TextButton } from '@/app/components/Button';
import { StyledButton } from '@/app/components/Button/StyledButton';
import { UnderlineText } from '@/app/components/DropdownText';
import Modal from '@/app/components/Modal';
import ModalContent from '@/app/components/ModalContent';
import { Typography } from '@/app/theme';
import CrossIcon from '@/assets/icons/failure.svg';
import TickIcon from '@/assets/icons/tick.svg';
import { useEvmSwitchChain } from '@/hooks/useEvmSwitchChain';
import { PENDING_MIGRATIONS_QUERY_KEY, isClearedMigrationLock } from '@/hooks/usePendingMigrations';
import { useSpokeProvider } from '@/hooks/useSpokeProvider';
import { sodax } from '@/lib/sodax';
import { useWalletModalToggle } from '@/store/application/hooks';
import { useXAccount } from '@balancednetwork/xwagmi';
import { xChainMap } from '@balancednetwork/xwagmi';
import { DetailedLock, SonicSpokeProvider } from '@sodax/sdk';
import { SONIC_MAINNET_CHAIN_ID } from '@sodax/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Flex } from 'rebass/styled-components';
import { Flex as FlexBox } from 'rebass/styled-components';
import styled from 'styled-components';

const UNSTAKE_TIME = 180 * 24 * 60 * 60; // 180 days

enum MigrationStatus {
  None,
  Migrating,
  Success,
  Failure,
}

const StyledMigrationItem = styled(Flex)`
  justify-content: space-between;
  align-items: flex-start;
  flex-direction: column;
  margin-bottom: 8px;

  .content-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .left-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .right-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
    text-align: right;
    padding-left: 20px;
  }

  .staking-button-wrap {
    display: flex;
    flex-direction: row;
    align-items: baseline;
    justify-content: flex-end;
    gap: 7px;
    flex-wrap: nowrap;
    white-space: nowrap;
  }

  @media (max-width: 550px) {
    .content-section {
      flex-direction: column;
      gap: 8px;
    }
    
    .right-content {
      text-align: left;
      padding-left: 0;
    }

    .staking-button-wrap {
      justify-content: flex-start;
    }

    p {
      text-align: center;
    }
  }
`;

interface MigrationItemProps {
  migration: DetailedLock;
  index: number;
  shouldAutoOpenStakeModal?: boolean;
}

const MigrationItem: React.FC<MigrationItemProps> = ({ migration, index, shouldAutoOpenStakeModal = false }) => {
  const toNumber = (value: number | string | bigint): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return Number(value);
    return Number(value);
  };

  const toBigInt = (value: number | string | bigint): bigint => {
    if (typeof value === 'bigint') return value;
    if (typeof value === 'number') return BigInt(value);
    return BigInt(value);
  };

  const lockUnlockTimeSec = toNumber(migration.unlockTime);
  const unstakeStartTimeSec = toNumber(migration.unstakeRequest.startTime);
  const unstakeCompleteTimeSec = unstakeStartTimeSec + UNSTAKE_TIME;

  // Migration lock is still locked when its unlock date is in the future.
  const isLocked = lockUnlockTimeSec > Date.now() / 1000;
  // "Unstaking" means the user has asked to unstake and is inside the 6-month
  // cooldown (independent of the migration lock).
  const isUnstaking = toBigInt(migration.unstakeRequest.amount) > 0n;
  // "Staked" means there is active stake remaining. Treat either a non-zero
  // stakedSodaAmount or a non-zero xSodaAmount as staked — once everything is
  // moved into an unstakeRequest, stakedSodaAmount can drop to 0.
  const isStaked = toBigInt(migration.stakedSodaAmount) > 0n || toBigInt(migration.xSodaAmount) > 0n;

  const convertedAssetsQuery = useQuery({
    queryKey: ['sodax', 'staking', 'convertedAssets', migration.xSodaAmount.toString()],
    queryFn: async () => {
      const res = await sodax.staking.getConvertedAssets(migration.xSodaAmount);
      if (res.ok) return res.value;
      throw res.error;
    },
    enabled: migration.xSodaAmount > 0n,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const currentValueSoda = convertedAssetsQuery.data ?? migration.stakedSodaAmount;
  // Top-row title always shows the migrated SODA amount. For rows that have
  // been fully moved into an unstake request, sodaAmount can be 0 — fall back
  // to the unstake amount, and finally to the current staked value — so the
  // heading never reads "0 SODA" when there's actually a balance to see.
  const baseDisplayedSodaAmount =
    toBigInt(migration.sodaAmount) > 0n
      ? migration.sodaAmount
      : toBigInt(migration.unstakeRequest.amount) > 0n
        ? migration.unstakeRequest.amount
        : migration.sodaAmount;
  const displayedSodaAmount =
    toBigInt(baseDisplayedSodaAmount) === 0n && toBigInt(currentValueSoda) > 0n
      ? currentValueSoda
      : baseDisplayedSodaAmount;

  // Check if user has EVM address signed in
  const evmAccount = useXAccount('EVM');
  const toggleWalletModal = useWalletModalToggle();

  // Local modal states
  const [stakeModalOpen, setStakeModalOpen] = useState(false);
  const [unstakeModalOpen, setUnstakeModalOpen] = useState(false);
  const [claimModalOpen, setClaimModalOpen] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-open staking modal when shouldAutoOpenStakeModal becomes true (only once per migration)
  // Only prompt if lock-up time is 12 months or more
  useEffect(() => {
    if (shouldAutoOpenStakeModal) {
      // Only auto-open if user is signed in with EVM wallet
      if (evmAccount?.address) {
        // Check if lock-up time is 12 months or more (12 * 30 * 24 * 60 * 60 seconds)
        const TWELVE_MONTHS_IN_SECONDS = 12 * 29 * 24 * 60 * 60;
        const currentTime = Math.floor(Date.now() / 1000);
        const unlockTime =
          typeof migration.unlockTime === 'bigint'
            ? Number(migration.unlockTime)
            : typeof migration.unlockTime === 'string'
              ? parseInt(migration.unlockTime)
              : migration.unlockTime;
        const remainingLockTime = unlockTime - currentTime;

        // Only auto-open if remaining lock time is 12 months or more
        if (remainingLockTime >= TWELVE_MONTHS_IN_SECONDS) {
          // Clear any existing timeout
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }

          // Add 2 second delay before opening the modal
          timeoutRef.current = setTimeout(() => {
            setStakeModalOpen(true);
            timeoutRef.current = null;
          }, 2000);
        }
      }
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [shouldAutoOpenStakeModal, evmAccount?.address, migration.unlockTime]);

  const isClaimable = !isLocked;
  const showCurrentValueRow = migration.xSodaAmount > 0n || currentValueSoda > 0n;
  const claimAmount = migration.xSodaAmount > 0n ? migration.xSodaAmount : displayedSodaAmount;
  const claimSymbol = migration.xSodaAmount > 0n ? 'xSODA' : 'SODA';

  // Determine state based on staking, unstaking, and lock status
  const getState = () => {
    if (isClaimable) return 'claimable';
    if (isUnstaking) return 'unstaking';
    if (isStaked) return 'staked';
    return 'not-staked';
  };

  const state = getState();

  const formatUnlockDate = (unlockTime: number | string | bigint) => {
    try {
      let timestamp: number;
      if (typeof unlockTime === 'bigint') {
        timestamp = Number(unlockTime);
      } else if (typeof unlockTime === 'string') {
        timestamp = parseInt(unlockTime);
      } else {
        timestamp = unlockTime;
      }
      const date = new Date(timestamp * 1000);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Unknown date';
    }
  };

  const formatAmount = (amount: string | number | bigint) => {
    try {
      let amountBN: number;
      if (typeof amount === 'bigint') {
        amountBN = Number(amount);
      } else if (typeof amount === 'string') {
        amountBN = parseFloat(amount);
      } else {
        amountBN = amount;
      }
      const value = amountBN / 10 ** 18;
      const decimals = value >= 10 ? 0 : 2;
      return value.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    } catch {
      return '0';
    }
  };

  // Top-row right side: always the migration-lock unlock status. The 6-month
  // unstake countdown lives in the bottom row instead (see `getUnstakeText`).
  const getDateText = () => {
    return isLocked
      ? `Unlocks ${formatUnlockDate(lockUnlockTimeSec)}`
      : `Available since ${formatUnlockDate(lockUnlockTimeSec)}`;
  };

  // Bottom-row right side prefix: only the 6-month unstake countdown, shown
  // only while an unstake request is active and the lock hasn't already
  // unlocked (claim takes priority once unlocked).
  const getUnstakeText = () => {
    if (state !== 'unstaking') return null;
    return `Unstakes ${formatUnlockDate(unstakeCompleteTimeSec)}`;
  };

  const handleActionClick = (action: 'stake' | 'unstake' | 'claim') => {
    if (!evmAccount?.address) {
      // User not signed in, open wallet modal
      toggleWalletModal();
    } else {
      // User is signed in, open appropriate modal
      if (action === 'stake') {
        setStakeModalOpen(true);
      } else if (action === 'unstake') {
        setUnstakeModalOpen(true);
      } else {
        setClaimModalOpen(true);
      }
    }
  };

  const getActionButton = () => {
    switch (state) {
      case 'not-staked':
        return (
          <UnderlineText onClick={() => handleActionClick('stake')}>
            <Typography color="primaryBright">Stake</Typography>
          </UnderlineText>
        );
      case 'unstaking':
        return (
          <UnderlineText onClick={() => handleActionClick('stake')}>
            <Typography color="primaryBright">Stake</Typography>
          </UnderlineText>
        );
      case 'staked':
        return (
          <UnderlineText onClick={() => handleActionClick('unstake')}>
            <Typography color="primaryBright">Unstake</Typography>
          </UnderlineText>
        );
      case 'claimable':
        return (
          <UnderlineText onClick={() => handleActionClick('claim')}>
            <Typography color="primaryBright">Claim</Typography>
          </UnderlineText>
        );
      default:
        return null;
    }
  };

  const getStakingRewards = () => {
    if (state === 'staked' || state === 'unstaking' || state === 'claimable') {
      const stakingRewards = 200; // This should be calculated from actual data
      return (
        <Typography color="text" fontSize={14} textAlign="left">
          +{stakingRewards} SODA staking rewards
        </Typography>
      );
    }
    return null;
  };

  // Defensive: a cleared lock (e.g. post-claim) has all fields zeroed and
  // should not render any UI, but it must stay in the underlying array so
  // later locks keep their SDK index.
  if (isClearedMigrationLock(migration)) {
    return null;
  }

  const unstakeText = getUnstakeText();

  return (
    <>
      <StyledMigrationItem>
        <div className="content-section">
          <div className="left-content">
            <Typography color="text" fontSize={16} textAlign="left">
              {formatAmount(migration.balnAmount)} BALN for {formatAmount(displayedSodaAmount)} SODA
            </Typography>
            {showCurrentValueRow && (
              <Typography color="text2" fontSize={14} textAlign="left">
                {formatAmount(migration.xSodaAmount)} xSODA | Current value: {formatAmount(currentValueSoda)} SODA
              </Typography>
            )}
          </div>

          <div className="right-content">
            <Typography color="text1" fontSize={14} textAlign="right">
              {getDateText()}
            </Typography>
            <Typography className="staking-button-wrap" color="text2" fontSize={14} textAlign="right">
              {unstakeText ? <span>{unstakeText}</span> : null}
              <span style={{ display: 'inline-block', marginLeft: unstakeText ? '7px' : 0 }}>{getActionButton()}</span>
            </Typography>
          </div>
        </div>
      </StyledMigrationItem>

      <StakeSodaModal
        migration={migration}
        index={index}
        isOpen={stakeModalOpen}
        onClose={() => setStakeModalOpen(false)}
        isUnstaking={isUnstaking}
      />
      <UnstakeSodaModal
        migration={migration}
        index={index}
        isOpen={unstakeModalOpen}
        onClose={() => setUnstakeModalOpen(false)}
      />
      <ClaimSodaModal
        index={index}
        migration={migration}
        claimAmount={claimAmount}
        claimSymbol={claimSymbol}
        isOpen={claimModalOpen}
        onClose={() => setClaimModalOpen(false)}
      />
    </>
  );
};

// Stake SODA Modal Component
const StakeSodaModal: React.FC<{
  migration: DetailedLock;
  index: number;
  isOpen: boolean;
  isUnstaking: boolean;
  onClose: () => void;
}> = ({ migration, isOpen, onClose, index, isUnstaking }) => {
  const evmAccount = useXAccount('EVM');
  const spokeProvider = useSpokeProvider(SONIC_MAINNET_CHAIN_ID);
  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(SONIC_MAINNET_CHAIN_ID);
  const queryClient = useQueryClient();
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus>(MigrationStatus.None);
  const [error, setError] = useState<string | null>(null);

  const handleDismiss = useCallback(() => {
    onClose();
    setTimeout(() => {
      setMigrationStatus(MigrationStatus.None);
      setError(null);
    }, 500);
  }, [onClose]);

  const slowDismiss = useCallback(() => {
    setTimeout(() => {
      handleDismiss();
    }, 3000);
  }, [handleDismiss]);

  const formatAmount = (amount: string | number | bigint) => {
    try {
      let amountBN: number;
      if (typeof amount === 'bigint') {
        amountBN = Number(amount);
      } else if (typeof amount === 'string') {
        amountBN = parseFloat(amount);
      } else {
        amountBN = amount;
      }
      const value = amountBN / 10 ** 18;
      const decimals = value >= 10 ? 0 : 2;
      return value.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    } catch {
      return '0';
    }
  };

  const handleStake = async () => {
    if (!evmAccount?.address || !spokeProvider) {
      setError('Wallet not connected');
      return;
    }

    if (isWrongChain) {
      setError('Please switch to the correct chain first');
      return;
    }

    setMigrationStatus(MigrationStatus.Migrating);
    setError(null);

    try {
      let result: string | undefined;

      if (isUnstaking) {
        result = await sodax.migration.balnSwapService.cancelUnstake(
          { lockId: BigInt(index) },
          spokeProvider as SonicSpokeProvider,
        );
      } else {
        result = await sodax.migration.balnSwapService.stake(
          { lockId: BigInt(index) },
          spokeProvider as SonicSpokeProvider,
        );
      }

      if (result) {
        setMigrationStatus(MigrationStatus.Success);
        queryClient.invalidateQueries({ queryKey: [PENDING_MIGRATIONS_QUERY_KEY] });
        slowDismiss();
      }
    } catch (err) {
      console.error('Staking error:', err);
      setError(err instanceof Error ? err.message : 'Staking failed');
      setMigrationStatus(MigrationStatus.Failure);
    }
  };

  const handleCancel = () => {
    if (migrationStatus !== MigrationStatus.Migrating) {
      handleDismiss();
    }
  };

  const isProcessing = migrationStatus === MigrationStatus.Migrating;

  return (
    <Modal isOpen={isOpen} onDismiss={handleCancel}>
      <ModalContent noMessages>
        <Typography textAlign="center" mb={2}>
          Stake SODA?
        </Typography>

        <Typography textAlign="center" fontSize={24} fontWeight="bold" mb={3}>
          {formatAmount(isUnstaking ? migration.unstakeRequest.amount : migration.sodaAmount)} SODA
        </Typography>

        <Typography textAlign="center" fontSize={14} mb={4}>
          You'll earn rewards, but unstaking takes 6 months unless you pay a large penalty fee.
        </Typography>

        <AnimatePresence>
          {migrationStatus === MigrationStatus.Failure && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <FlexBox pt={3} alignItems="center" justifyContent="center" flexDirection="column" className="border-top">
                <Typography mb={4}>Staking failed</Typography>
                {error ? (
                  <Typography maxWidth="320px" color="alert" textAlign="center">
                    {error}
                  </Typography>
                ) : (
                  <CrossIcon width={20} height={20} />
                )}
              </FlexBox>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {migrationStatus !== MigrationStatus.Success && (
            <motion.div
              key={'stake-actions'}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <FlexBox justifyContent="center" mt={4} pt={4} className="border-top">
                <TextButton onClick={handleCancel} fontSize={14}>
                  {isProcessing || migrationStatus === MigrationStatus.Failure ? 'Close' : 'Cancel'}
                </TextButton>

                {migrationStatus !== MigrationStatus.Failure &&
                  (isWrongChain ? (
                    <StyledButton onClick={handleSwitchChain} fontSize={14}>
                      Switch to {xChainMap[SONIC_MAINNET_CHAIN_ID].name}
                    </StyledButton>
                  ) : (
                    <StyledButton onClick={handleStake} fontSize={14} $loading={isProcessing} disabled={isProcessing}>
                      {isProcessing ? 'Staking...' : 'Stake'}
                    </StyledButton>
                  ))}
              </FlexBox>
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
              <FlexBox pt={3} alignItems="center" justifyContent="center" flexDirection="column" className="border-top">
                <Typography mb={4}>Staking completed</Typography>
                <TickIcon width={20} height={20} />
              </FlexBox>
            </motion.div>
          )}
        </AnimatePresence>
      </ModalContent>
    </Modal>
  );
};

// Unstake SODA Modal Component
const UnstakeSodaModal: React.FC<{
  migration: DetailedLock;
  index: number;
  isOpen: boolean;
  onClose: () => void;
}> = ({ migration, isOpen, onClose, index }) => {
  const evmAccount = useXAccount('EVM');
  const spokeProvider = useSpokeProvider(SONIC_MAINNET_CHAIN_ID);
  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(SONIC_MAINNET_CHAIN_ID);
  const queryClient = useQueryClient();
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus>(MigrationStatus.None);
  const [error, setError] = useState<string | null>(null);

  const handleDismiss = useCallback(() => {
    onClose();
    setTimeout(() => {
      setMigrationStatus(MigrationStatus.None);
      setError(null);
    }, 500);
  }, [onClose]);

  const slowDismiss = useCallback(() => {
    setTimeout(() => {
      handleDismiss();
    }, 3000);
  }, [handleDismiss]);

  const formatAmount = (amount: string | number | bigint) => {
    try {
      let amountBN: number;
      if (typeof amount === 'bigint') {
        amountBN = Number(amount);
      } else if (typeof amount === 'string') {
        amountBN = parseFloat(amount);
      } else {
        amountBN = amount;
      }
      const value = amountBN / 10 ** 18;
      const decimals = value >= 10 ? 0 : 2;
      return value.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    } catch {
      return '0';
    }
  };

  const formatUnlockDate = (unlockTime: number | string | bigint) => {
    try {
      let timestamp: number;
      if (typeof unlockTime === 'bigint') {
        timestamp = Number(unlockTime);
      } else if (typeof unlockTime === 'string') {
        timestamp = parseInt(unlockTime);
      } else {
        timestamp = unlockTime;
      }
      const date = new Date(timestamp * 1000);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Unknown date';
    }
  };

  const handleUnstake = async () => {
    if (!evmAccount?.address || !spokeProvider) {
      setError('Wallet not connected');
      return;
    }

    if (isWrongChain) {
      setError('Please switch to the correct chain first');
      return;
    }

    setMigrationStatus(MigrationStatus.Migrating);
    setError(null);

    try {
      const result = await sodax.migration.balnSwapService.unstake(
        { lockId: BigInt(index) },
        spokeProvider as SonicSpokeProvider,
      );

      if (result) {
        setMigrationStatus(MigrationStatus.Success);
        queryClient.invalidateQueries({ queryKey: [PENDING_MIGRATIONS_QUERY_KEY] });
        slowDismiss();
      }
    } catch (err) {
      console.error('Unstaking error:', err);
      setError(err instanceof Error ? err.message : 'Unstaking failed');
      setMigrationStatus(MigrationStatus.Failure);
    }
  };

  const handleCancel = () => {
    if (migrationStatus !== MigrationStatus.Migrating) {
      handleDismiss();
    }
  };

  const isProcessing = migrationStatus === MigrationStatus.Migrating;

  return (
    <Modal isOpen={isOpen} onDismiss={handleCancel}>
      <ModalContent noMessages>
        <Typography textAlign="center" mb={2}>
          Unstake SODA?
        </Typography>

        <Typography textAlign="center" fontSize={24} fontWeight="bold" mb={3}>
          {formatAmount(migration.stakedSodaAmount)} SODA
        </Typography>

        <Typography textAlign="center" fontSize={14} mb={4}>
          Your SODA will unstake on{' '}
          <strong style={{ color: 'white' }}>{formatUnlockDate(Math.floor(Date.now() / 1000) + UNSTAKE_TIME)}</strong>.
        </Typography>

        <AnimatePresence>
          {migrationStatus === MigrationStatus.Failure && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <FlexBox pt={3} alignItems="center" justifyContent="center" flexDirection="column" className="border-top">
                <Typography mb={4}>Unstaking failed</Typography>
                {error ? (
                  <Typography maxWidth="320px" color="alert" textAlign="center">
                    {error}
                  </Typography>
                ) : (
                  <CrossIcon width={20} height={20} />
                )}
              </FlexBox>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {migrationStatus !== MigrationStatus.Success && (
            <motion.div
              key={'unstake-actions'}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <FlexBox justifyContent="center" mt={4} pt={4} className="border-top">
                <TextButton onClick={handleCancel} fontSize={14}>
                  {isProcessing || migrationStatus === MigrationStatus.Failure ? 'Close' : 'Cancel'}
                </TextButton>

                {migrationStatus !== MigrationStatus.Failure &&
                  (isWrongChain ? (
                    <StyledButton onClick={handleSwitchChain} fontSize={14}>
                      Switch to {xChainMap[SONIC_MAINNET_CHAIN_ID].name}
                    </StyledButton>
                  ) : (
                    <StyledButton onClick={handleUnstake} fontSize={14} $loading={isProcessing} disabled={isProcessing}>
                      {isProcessing ? 'Unstaking...' : 'Unstake'}
                    </StyledButton>
                  ))}
              </FlexBox>
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
              <FlexBox pt={3} alignItems="center" justifyContent="center" flexDirection="column" className="border-top">
                <Typography mb={4}>Unstaking completed</Typography>
                <TickIcon width={20} height={20} />
              </FlexBox>
            </motion.div>
          )}
        </AnimatePresence>
      </ModalContent>
    </Modal>
  );
};

// Claim SODA Modal Component
const ClaimSodaModal: React.FC<{
  migration: DetailedLock;
  index: number;
  claimAmount: string | number | bigint;
  claimSymbol: string;
  isOpen: boolean;
  onClose: () => void;
}> = ({ migration, isOpen, onClose, index, claimAmount, claimSymbol }) => {
  const evmAccount = useXAccount('EVM');
  const spokeProvider = useSpokeProvider(SONIC_MAINNET_CHAIN_ID);
  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(SONIC_MAINNET_CHAIN_ID);
  const queryClient = useQueryClient();
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus>(MigrationStatus.None);
  const [error, setError] = useState<string | null>(null);

  const handleDismiss = useCallback(() => {
    onClose();
    setTimeout(() => {
      setMigrationStatus(MigrationStatus.None);
      setError(null);
    }, 500);
  }, [onClose]);

  const slowDismiss = useCallback(() => {
    setTimeout(() => {
      handleDismiss();
    }, 3000);
  }, [handleDismiss]);

  const formatAmount = (amount: string | number | bigint) => {
    try {
      let amountBN: number;
      if (typeof amount === 'bigint') {
        amountBN = Number(amount);
      } else if (typeof amount === 'string') {
        amountBN = parseFloat(amount);
      } else {
        amountBN = amount;
      }
      return (amountBN / 10 ** 18).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } catch {
      return '0';
    }
  };

  const handleClaim = async () => {
    if (!evmAccount?.address || !spokeProvider) {
      setError('Wallet not connected');
      return;
    }

    if (isWrongChain) {
      setError('Please switch to the correct chain first');
      return;
    }

    setMigrationStatus(MigrationStatus.Migrating);
    setError(null);

    try {
      const result = await sodax.migration.balnSwapService.claim(
        { lockId: BigInt(index) },
        spokeProvider as SonicSpokeProvider,
      );

      if (result) {
        setMigrationStatus(MigrationStatus.Success);
        queryClient.invalidateQueries({ queryKey: [PENDING_MIGRATIONS_QUERY_KEY] });
        slowDismiss();
      }
    } catch (err) {
      console.error('Claim error:', err);
      setError(err instanceof Error ? err.message : 'Claim failed');
      setMigrationStatus(MigrationStatus.Failure);
    }
  };

  const handleCancel = () => {
    if (migrationStatus !== MigrationStatus.Migrating) {
      handleDismiss();
    }
  };

  const isProcessing = migrationStatus === MigrationStatus.Migrating;

  return (
    <Modal isOpen={isOpen} onDismiss={handleCancel}>
      <ModalContent noMessages>
        <Typography textAlign="center" mb={2}>
          Claim {claimSymbol}?
        </Typography>

        <Typography textAlign="center" fontSize={24} fontWeight="bold" mb={3}>
          {formatAmount(claimAmount)} {claimSymbol}
        </Typography>

        <Typography textAlign="center" fontSize={14} mb={4}>
          Your migrated tokens are unlocked and can be claimed now.
        </Typography>

        <AnimatePresence>
          {migrationStatus === MigrationStatus.Failure && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <FlexBox pt={3} alignItems="center" justifyContent="center" flexDirection="column" className="border-top">
                <Typography mb={4}>Claim failed</Typography>
                {error ? (
                  <Typography maxWidth="320px" color="alert" textAlign="center">
                    {error}
                  </Typography>
                ) : (
                  <CrossIcon width={20} height={20} />
                )}
              </FlexBox>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {migrationStatus !== MigrationStatus.Success && (
            <motion.div
              key={'claim-actions'}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <FlexBox justifyContent="center" mt={4} pt={4} className="border-top">
                <TextButton onClick={handleCancel} fontSize={14}>
                  {isProcessing || migrationStatus === MigrationStatus.Failure ? 'Close' : 'Cancel'}
                </TextButton>

                {migrationStatus !== MigrationStatus.Failure &&
                  (isWrongChain ? (
                    <StyledButton onClick={handleSwitchChain} fontSize={14}>
                      Switch to {xChainMap[SONIC_MAINNET_CHAIN_ID].name}
                    </StyledButton>
                  ) : (
                    <StyledButton onClick={handleClaim} fontSize={14} $loading={isProcessing} disabled={isProcessing}>
                      {isProcessing ? 'Claiming...' : 'Claim'}
                    </StyledButton>
                  ))}
              </FlexBox>
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
              <FlexBox pt={3} alignItems="center" justifyContent="center" flexDirection="column" className="border-top">
                <Typography mb={4}>Claim completed</Typography>
                <TickIcon width={20} height={20} />
              </FlexBox>
            </motion.div>
          )}
        </AnimatePresence>
      </ModalContent>
    </Modal>
  );
};

export default MigrationItem;
