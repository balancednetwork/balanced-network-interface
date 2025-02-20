import React from 'react';

import { Trans } from '@lingui/macro';
import { Box, Flex } from 'rebass';

import { Button, TextButton } from '@/app/components/Button';
import { UnderlineText } from '@/app/components/DropdownText';
import Modal from '@/app/components/Modal';
import ModalContent from '@/app/components/ModalContent';
import { Typography } from '@/app/theme';
import { useSavingsXChainId, useUnclaimedRewards } from '@/store/savings/hooks';
import { useHasEnoughICX } from '@/store/wallet/hooks';
import { getXChainType, useXAccount, useXLockedBnUSDAmount } from '@balancednetwork/xwagmi';

import { calculateTotal, useRatesWithOracle } from '@/queries/reward';
import RewardsGrid from './RewardsGrid';

const SavingsRewards = () => {
  const savingsXChainId = useSavingsXChainId();
  const xAccount = useXAccount(getXChainType(savingsXChainId));
  const { data: savingsRewards } = useUnclaimedRewards();
  const hasEnoughICX = useHasEnoughICX();
  const [isOpen, setOpen] = React.useState(false);
  const { data: lockedAmount } = useXLockedBnUSDAmount(xAccount?.address, savingsXChainId);

  const rates = useRatesWithOracle();

  const totalRewardInUSD = calculateTotal(savingsRewards?.['0x1.icon'] || [], rates);
  const hasRewards = !!savingsRewards && totalRewardInUSD.gt(0);

  const toggleOpen = React.useCallback(() => {
    setOpen(!isOpen);
  }, [isOpen]);

  const handleClaim = async () => {
    // if (!account) return;
    // window.addEventListener('beforeunload', showMessageOnBeforeUnload);
    // try {
    //   const { result: hash } = await bnJs.inject({ account }).Savings.claimRewards();
    //   addTransaction(
    //     { hash },
    //     {
    //       pending: t`Claiming Savings Rate rewards...`,
    //       summary: t`Claimed Savings Rate rewards.`,
    //     },
    //   );
    //   toggleOpen();
    // } catch (e) {
    //   console.error('claiming savings rewards error: ', e);
    // } finally {
    //   window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
    // }
  };

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
              <Typography color="primaryBright" onClick={toggleOpen}>
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

      <Modal isOpen={isOpen} onDismiss={toggleOpen}>
        <ModalContent>
          <Typography textAlign="center" mb={1}>
            <Trans>Claim Savings Rate rewards?</Trans>
          </Typography>

          <Flex flexDirection="column" alignItems="center" mt={2}>
            {savingsRewards &&
              savingsRewards[savingsXChainId]?.map((reward, index) => (
                <Typography key={index} variant="p">
                  {/* {`${reward.toFixed(2, { groupSeparator: ',' })}`}{' '} */}
                  {`${reward.toFixed()}`}{' '}
                  <Typography as="span" color="text1">
                    {reward.currency.symbol}
                  </Typography>
                </Typography>
              ))}
          </Flex>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            <TextButton onClick={toggleOpen} fontSize={14}>
              <Trans>Not now</Trans>
            </TextButton>
            <Button onClick={handleClaim} fontSize={14} disabled={!hasEnoughICX}>
              <Trans>Claim</Trans>
            </Button>
          </Flex>
        </ModalContent>
      </Modal>
    </>
  );
};
export default SavingsRewards;
