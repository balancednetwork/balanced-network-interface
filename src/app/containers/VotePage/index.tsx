import React from 'react';

import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Flex } from 'rebass/styled-components';

import { DefaultLayout } from 'app/components/Layout';
import { BoxPanel } from 'app/components/Panel';
import ProposalInfo from 'app/components/ProposalInfo';
import { Typography } from 'app/theme';
import { useTotalProposalQuery } from 'queries/vote';

export function VotePage() {
  const { data: proposals } = useTotalProposalQuery();

  return (
    <DefaultLayout title="Vote">
      <Helmet>
        <title>Vote</title>
      </Helmet>

      <BoxPanel bg="bg2" width="100%">
        <Flex justifyContent="space-between" mb={5}>
          <Typography variant="h2">Proposals</Typography>
        </Flex>

        {proposals ? (
          proposals
            .sort((a, b) => b?.id - a?.id)
            .map(proposal => (
              <Link key={proposal.id} to={`/vote/proposal/${proposal?.id}`} style={{ textDecoration: 'none' }}>
                <ProposalInfo proposal={proposal} />
              </Link>
            ))
        ) : (
          <>
            <ProposalInfo proposal={null} />
            <ProposalInfo proposal={null} />
            <ProposalInfo proposal={null} />
            <ProposalInfo proposal={null} />
            <ProposalInfo proposal={null} />
            <ProposalInfo proposal={null} />
          </>
        )}
      </BoxPanel>
    </DefaultLayout>
  );
}
