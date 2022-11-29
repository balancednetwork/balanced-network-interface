import React, { useMemo } from 'react';

import { Trans } from '@lingui/macro';
import { useIconReact } from 'packages/icon-react';
import { Box, Flex } from 'rebass/styled-components';

import Divider from 'app/components/Divider';
import { BoxPanel } from 'app/components/Panel';
import PoolLogo from 'app/components/PoolLogo';
import QuestionHelper from 'app/components/QuestionHelper';
import { Typography } from 'app/theme';
import { COMBINED_TOKENS_LIST } from 'constants/tokens';
import { useCombinedVoteData, useTotalBBalnAllocated, useUserVoteData } from 'store/liveVoting/hooks';
import { VoteSource } from 'store/liveVoting/types';
import { useRewards } from 'store/reward/hooks';

import PowerLeftComponent from './PowerLeftComponent';
import { GirdHeaderItem, ScrollHelper, VoteItemWrap, VotingGrid } from './styledComponents';
import { formatFraction, formatFractionAmount } from './utils';
import VotingComponent from './VotingComponent';

const MemoizedVotingComponent = React.memo(VotingComponent);

export default function LiveVotingPanel() {
  const { account } = useIconReact();
  const { data: voteData } = useCombinedVoteData();
  const rewards = useRewards();
  const { data: totalBBAlnAllocation } = useTotalBBalnAllocated();
  const userVoteData = useUserVoteData();

  const VoteItem = ({
    name,
    vote,
    auth,
    border,
  }: {
    name: string;
    vote: VoteSource;
    auth: boolean;
    border: boolean;
  }) => {
    const { weight } = vote;
    const tokens = name.split('/');

    const baseCurrency = useMemo(
      () => (tokens.length === 2 ? COMBINED_TOKENS_LIST.find(token => token.symbol === tokens[0]) : undefined),
      [tokens],
    );

    const quoteCurrency = useMemo(
      () => (tokens.length === 2 ? COMBINED_TOKENS_LIST.find(token => token.symbol === tokens[1]) : undefined),
      [tokens],
    );

    return (
      <>
        <VoteItemWrap>
          <VotingGrid auth={auth}>
            <Flex alignItems="center">
              <Flex sx={{ minWidth: '95px' }} alignItems="center">
                {baseCurrency && quoteCurrency ? (
                  <Flex
                    alignItems={['start', 'start', 'start', 'center']}
                    flexDirection={['column', 'column', 'column', 'row']}
                  >
                    <PoolLogo baseCurrency={baseCurrency} quoteCurrency={quoteCurrency} respoVersion={true} />
                    <Typography
                      color="text"
                      fontSize={16}
                      fontWeight="bold"
                      style={{ whiteSpace: 'nowrap' }}
                      ml={[0, 0, 0, 2]}
                      mt={[1, 1, 1, 0]}
                    >{`${baseCurrency.symbol}/${quoteCurrency.symbol}`}</Typography>
                  </Flex>
                ) : (
                  <Typography color="text" fontSize={16} fontWeight="bold">
                    {name}
                  </Typography>
                )}
              </Flex>
            </Flex>

            {account && userVoteData && <MemoizedVotingComponent name={name} />}

            <Flex justifyContent="flex-end" my={'auto'} flexDirection="column">
              <Typography color="text" fontSize={16}>
                {formatFraction(weight)}
              </Typography>
              <Typography color="text1" fontSize={14}>
                {totalBBAlnAllocation ? `${formatFractionAmount(weight, totalBBAlnAllocation)} bBALN` : '-'}
              </Typography>
            </Flex>
            <Flex justifyContent="flex-end" alignItems="center">
              <Typography color="text" fontSize={16}>
                {rewards && rewards[name] ? `${rewards[name].toFormat(0)} BALN` : '-'}
              </Typography>
            </Flex>
          </VotingGrid>
        </VoteItemWrap>
        {border && <Divider my={1} />}
      </>
    );
  };

  return (
    <BoxPanel bg="bg2" width="100%" my={10}>
      <Flex justifyContent="space-between" mb={5} flexWrap="wrap">
        <Flex alignItems="center" mr={3}>
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
        <PowerLeftComponent />
      </Flex>
      <ScrollHelper>
        <VotingGrid auth={!!account && !!userVoteData}>
          <GirdHeaderItem>Pool</GirdHeaderItem>
          {!!account && !!userVoteData && <GirdHeaderItem>Your allocation</GirdHeaderItem>}
          <GirdHeaderItem>Current allocation</GirdHeaderItem>
          <GirdHeaderItem>Daily incentive</GirdHeaderItem>
        </VotingGrid>
        {voteData &&
          Object.keys(voteData)
            .sort((a, b) => {
              if (userVoteData && userVoteData[a] && userVoteData[b]) {
                if (userVoteData[a].power.lessThan(userVoteData[b].power)) return 1;
                if (userVoteData[b].power.lessThan(userVoteData[a].power)) return -1;
                return 0;
              } else {
                return 0;
              }
            })
            .map((item, index, array) => (
              <VoteItem
                key={item}
                name={item}
                vote={voteData[item]}
                auth={!!account && !!userVoteData}
                border={index + 1 !== array.length}
              />
            ))}
      </ScrollHelper>
    </BoxPanel>
  );
}
