import React from 'react';
import { Box } from 'rebass/styled-components';
import { Typography } from '@/app/theme';
import styled from 'styled-components';
import Divider from '@/app/components/Divider';
import { usePendingMigrations } from '@/hooks/usePendingMigrations';
import { useXAccount } from '@balancednetwork/xwagmi';
import MigrationItem from './MigrationItem';

const Migrations = styled(Box)`
  max-height: 125px;
  overflow-y: auto;
  
  @media (max-width: 550px) {
    max-height: 500px;
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
          return <MigrationItem key={index} migration={migration} />;
        })}
      </Migrations>
    </>
  );
};

export default PendingMigrations;
