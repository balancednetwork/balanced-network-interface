import { Button, TextButton } from '@/app/components/Button';
import { UnderlineText } from '@/app/components/DropdownText';
import Modal from '@/app/components/Modal';
import ModalContent from '@/app/components/ModalContent';
import { Typography } from '@/app/theme';
import { useWalletModalToggle } from '@/store/application/hooks';
import { useXAccount } from '@balancednetwork/xwagmi';
import { DetailedLock } from '@sodax/sdk';
import React, { useState } from 'react';
import { Flex } from 'rebass/styled-components';
import { Flex as FlexBox } from 'rebass/styled-components';
import styled from 'styled-components';

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
  }

  @media (max-width: 550px) {
    .content-section {
      flex-direction: column;
      gap: 8px;
    }
    
    .right-content {
      text-align: left;
    }
  }
`;

interface MigrationItemProps {
  migration: DetailedLock;
}

const MigrationItem: React.FC<MigrationItemProps> = ({ migration }) => {
  const isStaked = migration.stakedSodaAmount > 0;
  const isLocked = migration.unlockTime > Date.now() / 1000; // Fixed logic - locked means unlockTime is in the future

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
              {formatAmount(isStaked ? migration.stakedSodaAmount : migration.sodaAmount)} SODA
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
            <span>{getActionButton()}</span>
          </div>
        </div>
      </StyledMigrationItem>

      <StakeSodaModal migration={migration} isOpen={stakeModalOpen} onClose={() => setStakeModalOpen(false)} />
      <UnstakeSodaModal migration={migration} isOpen={unstakeModalOpen} onClose={() => setUnstakeModalOpen(false)} />
    </>
  );
};

// Stake SODA Modal Component
const StakeSodaModal: React.FC<{
  migration: DetailedLock;
  isOpen: boolean;
  onClose: () => void;
}> = ({ migration, isOpen, onClose }) => {
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

  const handleStake = () => {
    // TODO: Implement actual staking logic
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onDismiss={handleCancel}>
      <ModalContent>
        <Typography textAlign="center" mb={3} fontSize={18} fontWeight="bold">
          Stake SODA?
        </Typography>

        <Typography textAlign="center" fontSize={24} fontWeight="bold" mb={3}>
          {formatAmount(migration.sodaAmount)} SODA
        </Typography>

        <Typography textAlign="center" fontSize={14} mb={4}>
          You'll earn rewards, but unstaking takes 6 months unless you pay a large penalty fee.
        </Typography>

        <FlexBox justifyContent="center" mt={4} pt={4} className="border-top">
          <TextButton onClick={handleCancel} fontSize={14}>
            Cancel
          </TextButton>
          <Button onClick={handleStake} fontSize={14}>
            Stake
          </Button>
        </FlexBox>
      </ModalContent>
    </Modal>
  );
};

// Unstake SODA Modal Component
const UnstakeSodaModal: React.FC<{
  migration: DetailedLock;
  isOpen: boolean;
  onClose: () => void;
}> = ({ migration, isOpen, onClose }) => {
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

  const handleUnstake = () => {
    // TODO: Implement actual unstaking logic
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onDismiss={handleCancel}>
      <ModalContent>
        <Typography textAlign="center" mb={3} fontSize={18} fontWeight="bold">
          Unstake SODA?
        </Typography>

        <Typography textAlign="center" fontSize={24} fontWeight="bold" mb={3}>
          {formatAmount(migration.stakedSodaAmount)} SODA
        </Typography>

        <Typography textAlign="center" fontSize={14} mb={4}>
          Your SODA will unstake on {formatUnlockDate(migration.unlockTime)}.
        </Typography>

        <FlexBox justifyContent="center" mt={4} pt={4} className="border-top">
          <TextButton onClick={handleCancel} fontSize={14}>
            Cancel
          </TextButton>
          <Button onClick={handleUnstake} fontSize={14}>
            Unstake
          </Button>
        </FlexBox>
      </ModalContent>
    </Modal>
  );
};

export default MigrationItem;
