import React from 'react';

import { Trans } from '@lingui/macro';
import { useIconReact } from 'packages/icon-react';
import { Link } from 'react-router-dom';
import { Box, Flex } from 'rebass/styled-components';
import { useTheme } from 'styled-components';

import { Button, ButtonLink } from 'app/components/Button';
import { UnderlineText } from 'app/components/DropdownText';
import BBalnSlider from 'app/components/home/BBaln/BBalnSlider';
import { BoostedBox, BoostedInfo } from 'app/components/home/BBaln/styledComponents';
import { BoxPanel } from 'app/components/Panel';
import QuestionHelper from 'app/components/QuestionHelper';
import { Typography } from 'app/theme';
// import { useTotalProposalQuery, useActiveProposals } from 'queries/vote';
import { useFetchBBalnInfo } from 'store/bbaln/hooks';
import { useWalletFetchBalances } from 'store/wallet/hooks';

export function VotePage() {
  // const { data: proposals } = useTotalProposalQuery(1, 2);
  const { account } = useIconReact();
  useFetchBBalnInfo(account);
  useWalletFetchBalances(account);
  // const useActiveProposalsQuery = useActiveProposals();
  // const { data: activeProposals } = useActiveProposalsQuery;
  const theme = useTheme();

  // const shouldShowNotification = currentProposal => {
  //   return (
  //     activeProposals && activeProposals.filter(proposal => parseInt(proposal.id, 16) === currentProposal.id).length > 0
  //   );
  // };

  return (
    <Flex flexDirection="column" width="100%">
      {/* Voting power */}
      <BoxPanel bg="bg2" width="100%">
        {account && <BBalnSlider title="Voting power" />}
        <BoostedInfo showBorder={!!account}>
          <BoostedBox>
            <Typography fontSize={16} color="#FFF">
              Value
            </Typography>
            <Typography>Total voting power</Typography>
          </BoostedBox>
          <BoostedBox>
            <Typography fontSize={16} color="#FFF">
              Value
            </Typography>
            <Typography>Total locked</Typography>
          </BoostedBox>
          <BoostedBox className="no-border">
            <Typography fontSize={16} color="#FFF">
              Value
            </Typography>
            <Typography>Average lock-up time</Typography>
          </BoostedBox>
        </BoostedInfo>
      </BoxPanel>

      {/* Proposals */}
      <BoxPanel bg="bg2" width="100%" mt={10}>
        <Flex justifyContent="space-between" mb={5}>
          <Flex alignItems="center">
            <Typography variant="h2" mr={2}>
              <Trans>Proposals</Trans>
            </Typography>
            <Link
              to="/vote/proposal-list"
              style={{ color: theme.colors.primaryBright, fontSize: '14px', marginTop: '11px' }}
            >
              <UnderlineText>View all</UnderlineText>
            </Link>
          </Flex>
          {account && (
            <ButtonLink to="/vote/new-proposal/">
              <Trans>New proposal</Trans>
            </ButtonLink>
          )}
        </Flex>
      </BoxPanel>

      {/* LP voting */}
      <BoxPanel bg="bg2" width="100%" mt={10}>
        <Flex justifyContent="space-between" mb={5}>
          <Flex alignItems="center">
            <Typography variant="h2" mr={1}>
              <Trans>Liquidity incentives</Trans>
            </Typography>
            <Box marginTop="9px">
              <QuestionHelper
                width={300}
                text={
                  <>
                    <Typography>
                      47% of the daily BALN inflation is used to incentivise liquidity. bBALN holders can adjust the
                      amount allocated to each liquidity pool via "live" voting.
                    </Typography>
                    <Typography mt={3}>
                      Incentives are recalculated every week. You can adjust your allocation once every 10 days.
                    </Typography>
                  </>
                }
              />
            </Box>
          </Flex>
          {account && (
            <Button>
              <Trans>Adjust</Trans>
            </Button>
          )}
        </Flex>
      </BoxPanel>
    </Flex>
  );
}
