import React, { useMemo } from 'react';

import { Fraction } from '@balancednetwork/sdk-core';
import { Trans } from '@lingui/macro';
import { useIconReact } from 'packages/icon-react';
import { useMedia } from 'react-use';
import { Box, Flex } from 'rebass/styled-components';

import Divider from 'app/components/Divider';
import { BoxPanel } from 'app/components/Panel';
import PoolLogo from 'app/components/PoolLogo';
import QuestionHelper from 'app/components/QuestionHelper';
import { Typography } from 'app/theme';
import { COMBINED_TOKENS_LIST } from 'constants/tokens';
import { useBBalnAmount } from 'store/bbaln/hooks';
import { useCombinedVoteData, useNextUpdateDate, useUserVoteData } from 'store/liveVoting/hooks';
import { VoteSource } from 'store/liveVoting/types';
import { useRewards, useTotalLPRewards } from 'store/reward/hooks';

import { GirdHeaderItem, RespoLabel, VoteItemWrap, VotingGrid } from '../styledComponents';
import { formatFraction, formatTimeLeft, getSourceCurrentAllocationFormatted } from '../utils';
import PowerLeftComponent from './PowerLeftComponent';
import VotingComponent from './VotingComponent';

const MemoizedVotingComponent = React.memo(VotingComponent);

export default function LiveVotingPanel() {
  const { account } = useIconReact();
  const { data: voteData } = useCombinedVoteData();
  const rewards = useRewards();
  const totalLPRewards = useTotalLPRewards();
  const userVoteData = useUserVoteData();
  const bBalnAmount = useBBalnAmount();
  const nextUpdateDate = useNextUpdateDate();
  const isRespoLayout = !useMedia('(min-width: 800px)');

  const VoteItem = ({
    name,
    vote: source,
    auth,
    border,
  }: {
    name: string;
    vote: VoteSource;
    auth: boolean;
    border: boolean;
  }) => {
    const { weight, currentWeight } = source;
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
            <Flex alignItems="center" mb={isRespoLayout ? 4 : 0}>
              <Flex
                sx={{ minWidth: '95px' }}
                alignItems="center"
                flexDirection="column"
                style={{ position: 'relative' }}
              >
                {baseCurrency && quoteCurrency ? (
                  <Flex alignItems="center">
                    <PoolLogo baseCurrency={baseCurrency} quoteCurrency={quoteCurrency} respoVersion={false} />
                    <Typography
                      color="text"
                      fontSize={16}
                      fontWeight="bold"
                      style={{ whiteSpace: 'nowrap' }}
                      ml={2}
                    >{`${baseCurrency.symbol} / ${quoteCurrency.symbol}`}</Typography>
                  </Flex>
                ) : (
                  <Typography color="text" fontSize={16} fontWeight="bold">
                    {name}
                  </Typography>
                )}
              </Flex>
            </Flex>

            {auth && <MemoizedVotingComponent name={name} respoLayout={isRespoLayout} />}

            <Flex alignItems={isRespoLayout ? 'center' : 'end'} mb={isRespoLayout ? 4 : 0}>
              {isRespoLayout && (
                <RespoLabel>
                  <Trans>Future incentives</Trans>
                </RespoLabel>
              )}
              <Flex
                justifyContent="flex-end"
                my={'auto'}
                width={isRespoLayout ? 'auto' : '100%'}
                flexDirection="column"
              >
                <Typography color="text" fontSize={16}>
                  {totalLPRewards
                    ? `~ ${
                        currentWeight.greaterThan(0)
                          ? currentWeight.multiply(new Fraction(totalLPRewards.toFixed(0))).toFixed(0)
                          : weight.multiply(new Fraction(totalLPRewards.toFixed(0))).toFixed(0)
                      } BALN`
                    : '-'}
                </Typography>
                <Typography color="text1" fontSize={14}>
                  {`${getSourceCurrentAllocationFormatted(source)} (${formatFraction(
                    currentWeight.greaterThan(0) ? currentWeight : weight,
                  )})`}
                </Typography>
              </Flex>
            </Flex>
            <Flex alignItems={isRespoLayout ? 'center' : 'end'}>
              {isRespoLayout && (
                <RespoLabel>
                  <Trans>Current incentives</Trans>
                </RespoLabel>
              )}
              <Flex
                justifyContent="flex-end"
                my={'auto'}
                width={isRespoLayout ? 'auto' : '100%'}
                flexDirection="column"
              >
                <Typography color="text" fontSize={16}>
                  {rewards && rewards[name] ? `~ ${rewards[name].toFormat(0)} BALN` : '-'}
                </Typography>
                <Typography color="text1" fontSize={14}>
                  {formatFraction(weight)}
                </Typography>
              </Flex>
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
              hideOnSmall={false}
              text={
                <>
                  <Typography>
                    <Trans>
                      47% of the daily BALN inflation is used to incentivise liquidity. bBALN holders can adjust the
                      amount allocated to each liquidity pool via "live" voting.
                    </Trans>
                  </Typography>
                  <Typography mt={3}>
                    <Trans>
                      Incentives are recalculated every week. You can adjust your allocation once every 10 days.
                    </Trans>
                  </Typography>
                </>
              }
            />
          </Box>
        </Flex>
        <PowerLeftComponent />
      </Flex>
      {isRespoLayout && (
        <Typography fontSize={14} mt={-2} mb={3}>
          <Trans>Incentives will be updated in </Trans>{' '}
          <strong style={{ whiteSpace: 'nowrap' }}>{formatTimeLeft(nextUpdateDate)}</strong>.
        </Typography>
      )}
      {!isRespoLayout && (
        <VotingGrid auth={!!account && bBalnAmount.isGreaterThan(0) && !!userVoteData}>
          <GirdHeaderItem>Pool</GirdHeaderItem>
          {!!account && bBalnAmount.isGreaterThan(0) && !!userVoteData && (
            <GirdHeaderItem>
              <Trans>Your allocation</Trans>
            </GirdHeaderItem>
          )}
          <Flex width="100%" style={{ transform: 'translateX(20px)' }}>
            <GirdHeaderItem ml="auto" textAlign="right">
              <Trans>Future incentives</Trans>
            </GirdHeaderItem>
            <QuestionHelper
              width={300}
              hideOnSmall={false}
              text={
                <>
                  <Typography>
                    <Trans>Where bBALN holders have allocated their voting power, updated live.</Trans>
                  </Typography>
                  <Typography mt={3}>
                    <Trans>In</Trans> <strong>{formatTimeLeft(nextUpdateDate)}</strong>
                    <Trans>, the current incentives will be adjusted to reflect this allocation.</Trans>
                  </Typography>
                </>
              }
            />
          </Flex>
          <GirdHeaderItem>
            <Trans>Current incentives</Trans>
          </GirdHeaderItem>
        </VotingGrid>
      )}

      {voteData &&
        Object.keys(voteData)
          .sort((a, b) => {
            if (userVoteData && userVoteData[a]) {
              return -1;
            } else {
              return 1;
            }
          })
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
              auth={!!account && bBalnAmount.isGreaterThan(0) && !!userVoteData}
              border={index + 1 !== array.length}
            />
          ))}
    </BoxPanel>
  );
}
