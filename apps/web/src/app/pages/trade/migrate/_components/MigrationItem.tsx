import React from 'react';
import { Flex } from 'rebass/styled-components';
import { Typography } from '@/app/theme';
import styled from 'styled-components';
import { DetailedLock } from '@sodax/sdk';

const StyledMigrationItem = styled(Flex)`
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  .unlock-date {
    text-align: right;
    padding-left: 20px;
  }

  @media (max-width: 550px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    .unlock-date {
      text-align: left;
      padding-left: 0;
    }
  }
`;

interface MigrationItemProps {
  migration: DetailedLock;
}

const MigrationItem: React.FC<MigrationItemProps> = ({ migration }) => {
  const isStaked = migration.stakedSodaAmount > 0;

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

  return (
    <StyledMigrationItem>
      <Typography color="text" fontSize={16} textAlign="left">
        {formatAmount(migration.balnAmount)} BALN for{' '}
        {formatAmount(isStaked ? migration.stakedSodaAmount : migration.sodaAmount)} SODA
      </Typography>
      <Typography color="text2" fontSize={14} textAlign="left" className="unlock-date">
        Unlocks {formatUnlockDate(migration.unlockTime)}
      </Typography>
    </StyledMigrationItem>
  );
};

export default MigrationItem;
