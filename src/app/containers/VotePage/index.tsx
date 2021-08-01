import React from 'react';

import { Helmet } from 'react-helmet-async';
import {} from 'react-query';
import { Link } from 'react-router-dom';
import { Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button } from 'app/components/Button';
import { DefaultLayout } from 'app/components/Layout';
import ProposalInfo from 'app/components/ProposalInfo';
import { Typography } from 'app/theme';
import { useTotalProposalQuery } from 'queries/vote';

const VoteContainer = styled(Box)`
  flex: 1;
  border-radius: 10px;
  padding: 35px 35px;
  background-color: ${({ theme }) => theme.colors.bg2};
  margin-bottom: 50px;
`;

const VoteHeader = styled(Box)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(128px, 1fr));
  margin-bottom: 30px;
`;

export function VotePage() {
  const { data: proposals } = useTotalProposalQuery();

  return (
    <DefaultLayout title="Vote">
      <Helmet>
        <title>Vote</title>
      </Helmet>
      <VoteContainer>
        <VoteHeader>
          <Typography variant="h2">Proposals</Typography>
          <Link to="/vote/new-proposal">
            <Box style={{ textAlign: 'right' }}>
              <Button>New proposal</Button>
            </Box>
          </Link>
        </VoteHeader>
        {proposals
          ?.sort((a, b) => b?.id - a?.id)
          .map(proposal => (
            <Link key={proposal.id} to={`/vote/proposal/${proposal?.id}`} style={{ textDecoration: 'none' }}>
              <ProposalInfo proposal={proposal} />
            </Link>
          ))}
      </VoteContainer>
    </DefaultLayout>
  );
}
