import React from 'react';
import { Box, Flex } from 'rebass/styled-components';
import { Typography } from '@/app/theme';
import styled from 'styled-components';
import Divider from '@/app/components/Divider';
import { usePendingMigrations } from '@/hooks/usePendingMigrations';
import { useXAccount } from '@balancednetwork/xwagmi';

const Migrations = styled(Box)`
  max-height: 125px;
  overflow-y: auto;
  
  @media (max-width: 550px) {
    max-height: 500px;
  }
`;

const MigrationItem = styled(Flex)`
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

interface PendingMigrationsProps {
  userAddress?: string;
}

const PendingMigrations: React.FC<PendingMigrationsProps> = ({ userAddress }) => {
  const evmAccount = useXAccount('EVM');
  const { data: pendingMigrations = [], isLoading: loading, error } = usePendingMigrations(userAddress);

  // If user is not signed in, don't show anything
  if (!evmAccount?.address) {
    return null;
  }

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

  if (loading) {
    return (
      <>
        <Divider mt={5} />
        <Typography fontSize={16} color="text2" textAlign="center" mt={4} mb={2}>
          Pending BALN &gt; SODA migrations
        </Typography>
        <Typography color="text2" textAlign="center">
          Loading...
        </Typography>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Divider mt={5} />
        <Typography fontSize={16} color="text2" textAlign="center" mt={4} mb={2}>
          Pending BALN &gt; SODA migrations
        </Typography>
        <Typography color="alert" textAlign="center" mt={4}>
          {error?.message || 'Failed to fetch pending migrations'}
        </Typography>
      </>
    );
  }

  if (pendingMigrations.length === 0) {
    return null;
  }

  return (
    <>
      <Divider mt={5} />
      <Typography fontSize={16} color="text2" textAlign="center" mt={4} mb={3}>
        Pending BALN &gt; SODA migrations
      </Typography>

      <Migrations>
        {pendingMigrations.map((migration, index) => {
          return (
            <MigrationItem key={index}>
              <Typography color="text" fontSize={16} textAlign="left">
                {formatAmount(migration.balnAmount)} BALN for {formatAmount(migration.stakedSodaAmount)} SODA
              </Typography>
              <Typography color="text2" fontSize={14} textAlign="left" className="unlock-date">
                Unlocks {formatUnlockDate(migration.unlockTime)}
              </Typography>
            </MigrationItem>
          );
        })}
      </Migrations>
    </>
  );
};

export default PendingMigrations;
