import React from 'react';

import { Trans } from '@lingui/macro';
import { Box, Flex } from 'rebass';
import styled from 'styled-components';

import { BoxPanel } from 'app/components/Panel';
import QuestionHelper from 'app/components/QuestionHelper';
import { Typography } from 'app/theme';

import BribedSource, { BribeSkeleton } from './BribedSource';
import { useBribes } from './queries';

const Bribes = styled.div`
  display: grid;
  grid-gap: 35px;

  ${({ theme }) => theme.mediaWidth.upExtraSmall`
    grid-template-columns: repeat(2, 1fr);
  `};
  ${({ theme }) => theme.mediaWidth.upMedium`
    grid-template-columns: repeat(3, 1fr);
  `};
`;

export default function BribesPanel() {
  const { data: bribes, isLoading } = useBribes();

  return (
    <BoxPanel bg="bg2" width="100%" mt={10}>
      <Flex alignItems="center" mb="20px">
        <Typography variant="h2" mr={1} mb={1}>
          <Trans>Liquidity bribes</Trans>
        </Typography>
        <Box mt={1}>
          <QuestionHelper
            width={300}
            text={
              <>
                <Typography mb={2}>
                  <Trans>Vote to incentivise specific liquidity pools and earn a kickback for it.</Trans>
                </Typography>
                <Typography mb={2}>
                  <Trans>Bribes are released every Thursday at 12am UTC, and must be claimed within 7 days.</Trans>
                </Typography>
                <Typography color="text1">
                  <Trans>APR = (Average bribe (USD) x 52) ÷ (bBALN votes x BALN price)</Trans>
                </Typography>
              </>
            }
          />
        </Box>
      </Flex>
      <Bribes>
        {bribes ? (
          bribes.map((bribe, index) => <BribedSource key={index} bribe={bribe} />)
        ) : (
          <>
            <BribeSkeleton />
            <BribeSkeleton />
            <BribeSkeleton />
          </>
        )}
      </Bribes>
      {!isLoading && bribes?.length === 0 && (
        <Typography textAlign="center" color="text">
          <Trans>There are no bribes this week.</Trans>
        </Typography>
      )}
    </BoxPanel>
  );
}
