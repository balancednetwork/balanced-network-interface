import React from 'react';

import { Trans } from '@lingui/macro';
import { Box, Flex } from 'rebass';

import { UnderlineText } from '@/app/components/DropdownText';
import { Typography } from '@/app/theme';
import { useSavingsXChainId, useUnclaimedRewards } from '@/store/savings/hooks';
import { getXChainType, useXAccount, useXLockedBnUSDAmount } from '@balancednetwork/xwagmi';

import { calculateTotal, useRatesWithOracle } from '@/queries/reward';
import { CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import { useQueryClient } from '@tanstack/react-query';
import ClaimSavingsRewardsModal from './ClaimSavingsRewardsModal';
import RewardsGrid from './RewardsGrid';

const SavingsRewards = () => {
  const queryClient = useQueryClient();
  const savingsXChainId = useSavingsXChainId();
  const xAccount = useXAccount(getXChainType(savingsXChainId));
  const { data: savingsRewards } = useUnclaimedRewards();
  const [isOpen, setOpen] = React.useState(false);
  const { data: lockedAmount } = useXLockedBnUSDAmount(xAccount?.address, savingsXChainId);
  const [executionRewards, setExecutionRewards] = React.useState<CurrencyAmount<Token>[] | undefined>(undefined);

  const rates = useRatesWithOracle();

  const totalRewardInUSD = calculateTotal(savingsRewards?.['0x1.icon'] || [], rates);
  const hasRewards = !!savingsRewards && totalRewardInUSD.gt(0);

  return (
    <>
      <Box width="100%">
        <Flex justifyContent="space-between" mb={3} alignItems="center">
          <Flex>
            <Typography variant="h4" fontWeight="bold" fontSize={16} color="text">
              Savings rate
            </Typography>
          </Flex>
          {(hasRewards || (lockedAmount && lockedAmount.greaterThan(0) && xAccount.address)) && (
            <UnderlineText>
              <Typography
                color="primaryBright"
                onClick={() => {
                  setOpen(true);
                  setExecutionRewards(savingsRewards?.[savingsXChainId]);
                }}
              >
                <Trans>Claim</Trans>
              </Typography>
            </UnderlineText>
          )}
        </Flex>
        {savingsRewards && ((xAccount.address && hasRewards) || (lockedAmount && lockedAmount.greaterThan(0))) ? (
          <RewardsGrid rewards={savingsRewards[savingsXChainId]} />
        ) : (
          <Typography fontSize={14} opacity={0.75} mb={5}>
            Deposit bnUSD into the savings rate to earn interest.
          </Typography>
        )}
      </Box>

      <ClaimSavingsRewardsModal
        isOpen={isOpen}
        onClose={() => setOpen(false)}
        rewards={executionRewards}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['savingsRewards'] });
        }}
      />
    </>
  );
};
export default SavingsRewards;
