import React from 'react';

import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button } from 'app/components/Button';
import { DefaultLayout } from 'app/components/Layout';
import ProposalInfo from 'app/components/ProposalInfo';
import { Typography } from 'app/theme';
import { comparatorDesc } from 'utils';

const metadata = {
  voted: 16,
  voters: 748,
  approvePercentage: 53,
  rejectPercentage: 14,
  timestamp: 284400000,
};

export function VotePage() {
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

  const mockData = [
    {
      id: 3,
      title: 'Distribute more BALN to the DAO fund by reducing the BALN for loans and liquidity pools',
      content:
        'Too much income is being given back to people who use Balanced. While incentivization is good, we need to prevent Balanced from becoming a platform that people use purely to earn rewards.\nTo make sure Balanced has enough income in its treasury to cover ongoing costs, like security audits, a higher bug bounty, marketing initiatives, projects that utilize Balanced’s functionality, and so on, we should redirect some of the BALN allocated to borrowers and liquidity providers to the DAO fund instead.',
      metadata: metadata,
      status: 'pending',
    },
    {
      id: 2,
      title: 'Proposal 2',
      content:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas id hendrerit metus. Duis eget pellentesque ex. Pellentesque massa justo, aliquet eu dui at, pulvinar vestibulum tellus. Phasellus vel mi lobortis, iaculis libero tristique, volutpat tortor. Phasellus venenatis tellus eget tempor.\nElementum. Duis quis dapibus sapien, semper euismod dolor. Fusce at porttitor risus. Etiam vehicula massa aliquam elit sagittis pulvinar. Vivamus luctus lectus arcu, ac commodo turpis varius tempor.',
      metadata: metadata,
      status: 'approved',
    },
    {
      id: 1,
      title: 'Proposal 1',
      content:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas id hendrerit metus. Duis eget pellentesque ex. Pellentesque massa justo, aliquet eu dui at, pulvinar vestibulum tellus. Phasellus vel mi lobortis, iaculis libero tristique, volutpat tortor. Phasellus venenatis tellus eget tempor.\nElementum. Duis quis dapibus sapien, semper euismod dolor. Fusce at porttitor risus. Etiam vehicula massa aliquam elit sagittis pulvinar. Vivamus luctus lectus arcu, ac commodo turpis varius tempor.',
      metadata: metadata,
      status: 'approved',
    },
  ];
  return (
    <DefaultLayout title="Vote">
      <Helmet>
        <title>Vote</title>
      </Helmet>
      <VoteContainer>
        <VoteHeader>
          <Typography variant="h2">Proposals</Typography>
          <Box style={{ textAlign: 'right' }}>
            <Button>New Proposal</Button>
          </Box>
        </VoteHeader>
        {mockData
          .sort((a, b) => comparatorDesc(a.id, b.id))
          .map(ele => (
            <Link to={`/proposal/${ele?.id}`} style={{ textDecoration: 'none' }}>
              <ProposalInfo key={ele?.id} title={ele?.title} content={ele?.content} metadata={ele?.metadata} />
            </Link>
          ))}
      </VoteContainer>
    </DefaultLayout>
  );
}
