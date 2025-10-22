import { UnderlineText } from '@/app/components/DropdownText';
import { Typography } from '@/app/theme';
import { DetailedLock } from '@sodax/sdk';
import React from 'react';
import { Flex } from 'rebass/styled-components';
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

  const getActionButton = () => {
    switch (state) {
      case 'not-staked':
      case 'unstaking':
        return (
          <UnderlineText>
            <Typography color="primaryBright">Stake</Typography>
          </UnderlineText>
        );
      case 'staked':
        return (
          <UnderlineText>
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
  );
};

export default MigrationItem;
