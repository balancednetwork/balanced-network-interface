import React from 'react';

import { Trans } from '@lingui/macro';
import { Link } from 'react-router-dom';
import { Flex } from 'rebass/styled-components';
import { useTheme } from 'styled-components';

import { ButtonLink } from 'app/components/Button';
import Divider from 'app/components/Divider';
import { UnderlineText } from 'app/components/DropdownText';
import { BoxPanel } from 'app/components/Panel';
import { StyledSkeleton, VoteStatusLabel } from 'app/components/ProposalInfo/components';
import { Typography } from 'app/theme';
import { useTotalProposalQuery, useActiveProposals } from 'queries/vote';
import { useBBalnAmount } from 'store/bbaln/hooks';
import { normalizeContent } from 'utils';

import { Grid, ProposalPreview, StyledTypography } from './styledComponents';

export default function ProposalsPanel() {
  //temporary for lisbon
  const { data: proposals } = useTotalProposalQuery(10);
  const { data: activeProposals } = useActiveProposals();
  const theme = useTheme();
  const bBalnAmount = useBBalnAmount();

  const shouldShowNotification = currentProposal => {
    return (
      activeProposals && activeProposals.filter(proposal => parseInt(proposal.id, 16) === currentProposal.id).length > 0
    );
  };

  return (
    <BoxPanel bg="bg2" width="100%" mt={10}>
      <Flex justifyContent="space-between" mb={5} alignItems="start">
        <Flex alignItems={['start', 'center']} flexDirection={['column', 'row']}>
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
        {bBalnAmount.isGreaterThan(0) && (
          <Typography mt={['5px', '0']}>
            <ButtonLink to="/vote/new-proposal/">
              <Trans>New proposal</Trans>
            </ButtonLink>
          </Typography>
        )}
      </Flex>
      <Grid>
        {proposals ? (
          proposals
            .sort((a, b) => b?.id - a?.id)
            .map((proposal, index) => {
              return (
                index < 3 && (
                  <Link key={proposal.id} to={`/vote/proposal/${proposal?.id}`} style={{ textDecoration: 'none' }}>
                    <ProposalPreview bg="bg3" flexDirection="column">
                      <StyledTypography
                        variant="h3"
                        fontSize={16}
                        mt={-1}
                        notification={shouldShowNotification(proposal)}
                      >
                        {proposal.name}
                      </StyledTypography>
                      <Typography fontSize={14} color="text1" mt={2} mb="auto">
                        {proposal.description && normalizeContent(proposal.description, true)}
                      </Typography>
                      <Divider mt={3} mb={2}></Divider>
                      <Flex sx={{ rowGap: '10px' }} flexWrap="wrap" alignItems="center" mb={-2}>
                        <VoteStatusLabel proposal={proposal} />
                      </Flex>
                    </ProposalPreview>
                  </Link>
                )
              );
            })
        ) : (
          <>
            <ProposalPreview bg="bg3" flexDirection="column" noHover>
              <Typography variant="h3" fontSize={16} mt={-1}>
                <StyledSkeleton animation="wave"></StyledSkeleton>
                <StyledSkeleton animation="wave"></StyledSkeleton>
              </Typography>
              <Typography fontSize={14} color="text1" mt={2}>
                <StyledSkeleton animation="wave"></StyledSkeleton>
              </Typography>
              <Typography fontSize={14} color="text1">
                <StyledSkeleton animation="wave"></StyledSkeleton>
              </Typography>
              <Typography fontSize={14} color="text1">
                <StyledSkeleton animation="wave"></StyledSkeleton>
              </Typography>
              <Typography fontSize={14} color="text1" mb="auto">
                <StyledSkeleton animation="wave"></StyledSkeleton>
              </Typography>
              <Divider mt={3} mb={2}></Divider>
              <Typography fontSize={14} color="text1" mb={-2}>
                <StyledSkeleton animation="wave"></StyledSkeleton>
              </Typography>
            </ProposalPreview>
            <ProposalPreview bg="bg3" flexDirection="column" noHover>
              <Typography variant="h3" fontSize={16} mt={-1}>
                <StyledSkeleton animation="wave"></StyledSkeleton>
                <StyledSkeleton animation="wave"></StyledSkeleton>
              </Typography>
              <Typography fontSize={14} color="text1" mt={2}>
                <StyledSkeleton animation="wave"></StyledSkeleton>
              </Typography>
              <Typography fontSize={14} color="text1">
                <StyledSkeleton animation="wave"></StyledSkeleton>
              </Typography>
              <Typography fontSize={14} color="text1">
                <StyledSkeleton animation="wave"></StyledSkeleton>
              </Typography>
              <Typography fontSize={14} color="text1" mb="auto">
                <StyledSkeleton animation="wave"></StyledSkeleton>
              </Typography>
              <Divider mt={3} mb={2}></Divider>
              <Typography fontSize={14} color="text1" mb={-2}>
                <StyledSkeleton animation="wave"></StyledSkeleton>
              </Typography>
            </ProposalPreview>
            <ProposalPreview bg="bg3" flexDirection="column" noHover>
              <Typography variant="h3" fontSize={16} mt={-1}>
                <StyledSkeleton animation="wave"></StyledSkeleton>
                <StyledSkeleton animation="wave"></StyledSkeleton>
              </Typography>
              <Typography fontSize={14} color="text1" mt={2}>
                <StyledSkeleton animation="wave"></StyledSkeleton>
              </Typography>
              <Typography fontSize={14} color="text1">
                <StyledSkeleton animation="wave"></StyledSkeleton>
              </Typography>
              <Typography fontSize={14} color="text1">
                <StyledSkeleton animation="wave"></StyledSkeleton>
              </Typography>
              <Typography fontSize={14} color="text1" mb="auto">
                <StyledSkeleton animation="wave"></StyledSkeleton>
              </Typography>
              <Divider mt={3} mb={2}></Divider>
              <Typography fontSize={14} color="text1" mb={-2}>
                <StyledSkeleton animation="wave"></StyledSkeleton>
              </Typography>
            </ProposalPreview>
          </>
        )}
      </Grid>
    </BoxPanel>
  );
}
