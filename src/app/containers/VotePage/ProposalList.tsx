import React from 'react';

import { Trans } from '@lingui/macro';
import { AnimatePresence, motion } from 'framer-motion';
import { useIconReact } from 'packages/icon-react';
import { Link } from 'react-router-dom';
import { Flex } from 'rebass/styled-components';

import { ButtonLink } from 'app/components/Button';
import { BoxPanel } from 'app/components/Panel';
import ProposalInfo from 'app/components/ProposalInfo';
import { Typography } from 'app/theme';
import { useTotalProposalQuery, useActiveProposals } from 'queries/vote';
import { useFetchBBalnInfo } from 'store/bbaln/hooks';
import { useWalletFetchBalances } from 'store/wallet/hooks';

export function ProposalList() {
  const { data: proposals } = useTotalProposalQuery();
  const { account } = useIconReact();
  useFetchBBalnInfo(account);
  useWalletFetchBalances(account);
  const useActiveProposalsQuery = useActiveProposals();
  const { data: activeProposals } = useActiveProposalsQuery;

  const shouldShowNotification = currentProposal => {
    return (
      activeProposals && activeProposals.filter(proposal => parseInt(proposal.id, 16) === currentProposal.id).length > 0
    );
  };

  return (
    <>
      Breadcrumbs
      <BoxPanel bg="bg2" width="100%">
        <Flex justifyContent="space-between" mb={5}>
          <Typography variant="h2">
            <Trans>Proposals</Trans>
          </Typography>
          {account && (
            <ButtonLink to="/vote/new-proposal/">
              <Trans>New proposal</Trans>
            </ButtonLink>
          )}
        </Flex>

        {proposals ? (
          proposals
            .sort((a, b) => b?.id - a?.id)
            .map(proposal => (
              <AnimatePresence key={`wrap${proposal.id}`}>
                <motion.div
                  key={proposal.id}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'tween' }}
                >
                  <Link to={`/vote/proposal/${proposal?.id}`} style={{ textDecoration: 'none' }}>
                    <ProposalInfo proposal={proposal} showNotification={shouldShowNotification(proposal)} />
                  </Link>
                </motion.div>
              </AnimatePresence>
            ))
        ) : (
          <>
            <ProposalInfo />
            <ProposalInfo />
            <ProposalInfo />
            <ProposalInfo />
            <ProposalInfo />
            <ProposalInfo />
          </>
        )}
      </BoxPanel>
    </>
  );
}
