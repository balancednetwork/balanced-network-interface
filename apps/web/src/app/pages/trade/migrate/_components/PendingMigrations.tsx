import Divider from '@/app/components/Divider';
import { Typography } from '@/app/theme';
import { usePendingMigrations } from '@/hooks/usePendingMigrations';
import { useXAccount } from '@balancednetwork/xwagmi';
import { DetailedLock } from '@sodax/sdk';
import React, { useCallback } from 'react';
import { Box } from 'rebass/styled-components';
import styled from 'styled-components';
import MigrationItem from './MigrationItem';

const Migrations = styled(Box)`
  max-height: 155px;
  overflow-y: auto;
  padding: 0 20px;
  margin: 0 -20px;
  
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

  // Create unique IDs for migrations using their properties
  const getMigrationId = useCallback((migration: DetailedLock, index: number) => {
    return `${migration.balnAmount}-${migration.unlockTime}-${index}`;
  }, []);

  // Track previous migrations to detect new ones
  const prevMigrationsRef = React.useRef<readonly DetailedLock[]>([]);
  const autoOpenedMigrationIdsRef = React.useRef<Set<string>>(new Set());
  const hasInitializedRef = React.useRef<boolean>(false);
  const currentAddressRef = React.useRef<string | undefined>(undefined);
  const [shouldAutoOpenIndex, setShouldAutoOpenIndex] = React.useState<number | null>(null);

  // Reset tracking when address changes (user signs in/out or switches accounts)
  React.useEffect(() => {
    const currentAddress = evmAccount?.address;
    if (currentAddressRef.current !== currentAddress) {
      // Address changed, reset all tracking
      hasInitializedRef.current = false;
      prevMigrationsRef.current = [];
      autoOpenedMigrationIdsRef.current.clear();
      setShouldAutoOpenIndex(null);
      currentAddressRef.current = currentAddress;
    }
  }, [evmAccount?.address]);

  // Mark as initialized once loading completes (to distinguish initial load from new migrations)
  React.useEffect(() => {
    if (!loading && !hasInitializedRef.current && evmAccount?.address) {
      hasInitializedRef.current = true;
      // Set initial state of prevMigrationsRef after first load completes
      prevMigrationsRef.current = pendingMigrations;
    }
  }, [loading, pendingMigrations, evmAccount?.address]);

  // Detect when a new migration is added (only after initial load for current address)
  React.useEffect(() => {
    // Don't process until initial load is complete and user is signed in
    if (!hasInitializedRef.current || loading || !evmAccount?.address) {
      return;
    }

    const prevMigrations = prevMigrationsRef.current;
    const currentMigrations = pendingMigrations;

    // If count increased (handles 0->1, 1->2, etc.)
    if (currentMigrations.length > prevMigrations.length) {
      // Find the newest migration(s) by comparing lists
      const prevIds = new Set(prevMigrations.map((m, i) => getMigrationId(m, i)));

      // Find the first migration that wasn't in the previous list
      for (let i = 0; i < currentMigrations.length; i++) {
        const migrationId = getMigrationId(currentMigrations[i], i);
        if (!prevIds.has(migrationId) && !autoOpenedMigrationIdsRef.current.has(migrationId)) {
          // Found a new migration, mark it to auto-open
          setShouldAutoOpenIndex(i);
          autoOpenedMigrationIdsRef.current.add(migrationId);
          break; // Only open the first new migration we find
        }
      }
    }

    // Update the previous migrations reference
    prevMigrationsRef.current = currentMigrations;
  }, [pendingMigrations, getMigrationId, loading, evmAccount?.address]);

  // Reset shouldAutoOpenIndex after it's been consumed
  React.useEffect(() => {
    if (shouldAutoOpenIndex !== null) {
      // Reset after enough time to allow MigrationItem to consume it (2s delay + buffer)
      const timer = setTimeout(() => {
        setShouldAutoOpenIndex(null);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [shouldAutoOpenIndex]);

  // If user is not signed in, don't show anything
  if (!evmAccount?.address) {
    return null;
  }

  if (loading) {
    return (
      <>
        <Divider mt={5} />
        <Typography fontSize={16} color="text2" textAlign="center" mt={4} mb={2}>
          SODA migrated and locked
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
          SODA migrated and locked
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
        SODA migrated and locked
      </Typography>

      <Migrations>
        {pendingMigrations.map((migration, index) => {
          const isLast = index === pendingMigrations.length - 1;
          const shouldAutoOpenStakeModal = shouldAutoOpenIndex === index;
          return (
            <React.Fragment key={index}>
              <MigrationItem migration={migration} index={index} shouldAutoOpenStakeModal={shouldAutoOpenStakeModal} />
              {!isLast && <Divider my={3} />}
            </React.Fragment>
          );
        })}
      </Migrations>
    </>
  );
};

export default PendingMigrations;
