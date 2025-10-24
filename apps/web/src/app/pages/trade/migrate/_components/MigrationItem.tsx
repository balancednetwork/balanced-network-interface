import { Button, TextButton } from '@/app/components/Button';
import { StyledButton } from '@/app/components/Button/StyledButton';
import { UnderlineText } from '@/app/components/DropdownText';
import Modal from '@/app/components/Modal';
import ModalContent from '@/app/components/ModalContent';
import { Typography } from '@/app/theme';
import CrossIcon from '@/assets/icons/failure.svg';
import TickIcon from '@/assets/icons/tick.svg';
import { useEvmSwitchChain } from '@/hooks/useEvmSwitchChain';
import { useSpokeProvider } from '@/hooks/useSpokeProvider';
import { sodax } from '@/lib/sodax';
import { useWalletModalToggle } from '@/store/application/hooks';
import { useXAccount } from '@balancednetwork/xwagmi';
import { xChainMap } from '@balancednetwork/xwagmi';
import { DetailedLock, SonicSpokeProvider } from '@sodax/sdk';
import { SONIC_MAINNET_CHAIN_ID } from '@sodax/types';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useState, useCallback } from 'react';
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
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content:center;
      gap: 4px;
    }
  }
`;

interface MigrationItemProps {
  migration: DetailedLock;
  index: number;
}

const MigrationItem: React.FC<MigrationItemProps> = ({ migration, index }) => {
  const isStaked = migration.stakedSodaAmount > 0;
  const isLocked = migration.unlockTime > Date.now() / 1000; // Fixed logic - locked means unlockTime is in the future
  const isUnstaking = migration.unstakeRequest.amount > 0;

  // Check if user has EVM address signed in
  const evmAccount = useXAccount('EVM');
  const toggleWalletModal = useWalletModalToggle();

  // Local modal states
  const [stakeModalOpen, setStakeModalOpen] = useState(false);
  const [unstakeModalOpen, setUnstakeModalOpen] = useState(false);

  // Determine state based on staking and locking status
  const getState = () => {
    if (!isStaked && isLocked) return 'not-staked';
    if (isStaked && isLocked) return 'staked';
    if (isStaked && !isLocked) return 'unstaking';
    return 'unlocked-unstaking';
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
      return (amountBN / 10 ** 18).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } catch {
      return '0';
    }
  };

  const getDateText = () => {
    switch (state) {
      case 'not-staked':
      case 'staked':
        return `Unlocks ${formatUnlockDate(migration.unlockTime)}`;
      case 'unstaking':
        return `Unstakes ${formatUnlockDate(migration.unlockTime)}`;
      case 'unlocked-unstaking':
        return `Available since ${formatUnlockDate(migration.unlockTime)}`;
      default:
        return '';
    }
  };

  const handleActionClick = (action: 'stake' | 'unstake') => {
    if (!evmAccount?.address) {
      // User not signed in, open wallet modal
      toggleWalletModal();
    } else {
      // User is signed in, open appropriate modal
      if (action === 'stake') {
        setStakeModalOpen(true);
      } else {
        setUnstakeModalOpen(true);
      }
    }
  };

  const getActionButton = () => {
    switch (state) {
      case 'not-staked':
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
      case 'unlocked-unstaking':
        return null; // No action button for this state
      default:
        return null;
    }
  };

  const getStakingRewards = () => {
    if (state === 'staked' || state === 'unstaking' || state === 'unlocked-unstaking') {
      const stakingRewards = 200; // This should be calculated from actual data
      return (
        <Typography color="text" fontSize={14} textAlign="left">
          +{stakingRewards} SODA staking rewards
        </Typography>
      );
    }
    return null;
  };

  return (
    <>
      <StyledMigrationItem>
        <div className="content-section">
          <div className="left-content">
            <Typography color="text" fontSize={16} textAlign="left">
              {formatAmount(migration.balnAmount)} BALN for{' '}
              {formatAmount(
                isUnstaking
                  ? migration.unstakeRequest.amount
                  : isStaked
                    ? migration.stakedSodaAmount
                    : migration.sodaAmount,
              )}{' '}
              SODA
            </Typography>
            {/* {getStakingRewards()} */}
          </div>

          <div className="right-content">
            <Typography color="text1" fontSize={14} textAlign="right">
              {getDateText()}
            </Typography>
            {state === 'unstaking' && (
              <Typography color="text2" fontSize={14} textAlign="right">
                Unstakes {formatUnlockDate(migration.unlockTime)}
              </Typography>
            )}
            {state === 'unlocked-unstaking' && (
              <Typography color="text2" fontSize={14} textAlign="right">
                Unstakes {formatUnlockDate(migration.unlockTime)}
              </Typography>
            )}
            <Typography className="staking-button-wrap" color="text2" fontSize={14} textAlign="right">
              {isUnstaking ? (
                <span>{`Unstakes ${formatUnlockDate(Number(migration.unstakeRequest.startTime) + UNSTAKE_TIME)}`}</span>
              ) : (
                ''
              )}
              <span style={{ display: 'inline-block', marginLeft: '7px' }}>{getActionButton()}</span>
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
      // TODO: SODAX SDK staking methods are not yet available in the current version
      // This is a placeholder implementation that will be updated when the staking API is available

      // Convert staked SODA amount to bigint (assuming 18 decimals)
      const stakedAmount = BigInt(migration.stakedSodaAmount);
      console.log(migration);

      // Simulate API call delay
      const result = await sodax.migration.balnSwapService.unstake(
        { lockId: BigInt(index) },
        spokeProvider as SonicSpokeProvider,
      );

      console.log(result);
      if (result) {
        setMigrationStatus(MigrationStatus.Success);
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

export default MigrationItem;
