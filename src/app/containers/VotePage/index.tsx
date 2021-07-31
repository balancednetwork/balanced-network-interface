import React from 'react';

import { Helmet } from 'react-helmet-async';
import { QueryObserverResult } from 'react-query';
import { Link } from 'react-router-dom';
import { Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button } from 'app/components/Button';
import { DefaultLayout } from 'app/components/Layout';
import ProposalInfo from 'app/components/ProposalInfo';
import { Typography } from 'app/theme';
import { useTotalProposalQuery } from 'queries/vote';
import { ProposalInterface } from 'types';

import bnJs from '../../../bnJs';

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
  const totalProposalCount = bnJs.Governance.getTotalProposal();
  const LATEST = totalProposalCount.data;

  const totalProposal: QueryObserverResult<Array<ProposalInterface>> = useTotalProposalQuery(
    Math.floor(LATEST / 20) + 1,
  );
  const { data } = totalProposal;
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
        {data
          ?.sort((a, b) => b?.id - a?.id)
          .map(ele => (
            <Link key={`link-${ele?.id}`} to={`/vote/proposal/${ele?.id}`} style={{ textDecoration: 'none' }}>
              <ProposalInfo
                title={ele?.name}
                content={ele?.description}
                metadata={{
                  startDay: ele?.startDay,
                  endDay: ele?.endDay,
                  uniqueApproveVoters: ele?.uniqueApproveVoters,
                  uniqueRejectVoters: ele?.uniqueRejectVoters,
                  approvePercentage: ele?.for,
                  rejectPercentage: ele?.against,
                  status: ele?.status,
                }}
              />
            </Link>
          ))}
      </VoteContainer>
    </DefaultLayout>
  );
}
