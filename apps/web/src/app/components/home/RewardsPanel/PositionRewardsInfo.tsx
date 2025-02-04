import React from 'react';

import BigNumber from 'bignumber.js';
import styled from 'styled-components';

import { Typography } from '@/app/theme';
import { useAllPairs } from '@/queries/backendv2';
import { useIncentivisedSources, useWorkingBalance } from '@/store/bbaln/hooks';

import SourceInfo from './SourceInfo';

const Wrap = styled.div`
  ul {
    margin: 10px 0 0 0;
    padding-left: 25px;

    li {
    }
  }
`;

const PositionRewardsInfo = () => {
  const getWorkingBalance = useWorkingBalance();
  const { data: allPairs } = useAllPairs();
  const boostedLPs = useIncentivisedSources();

  const boostedLPNumbers = React.useMemo(
    () =>
      boostedLPs &&
      Object.values(boostedLPs).map(boostedLP =>
        getWorkingBalance(boostedLP.balance, boostedLP.supply).dividedBy(boostedLP.balance).dp(2).toNumber(),
      ),
    [boostedLPs, getWorkingBalance],
  );

  return (
    <Wrap>
      <Typography mt={3}>Your return:</Typography>
      <ul>
        {boostedLPNumbers !== undefined &&
          boostedLPNumbers?.length !== 0 &&
          boostedLPs &&
          Object.keys(boostedLPs).map(boostedLP => {
            const apy = allPairs?.find(pair => pair.name === boostedLP)?.balnApy;
            return (
              <SourceInfo
                key={boostedLP}
                name={boostedLP}
                boost={getWorkingBalance(boostedLPs[boostedLP].balance, boostedLPs[boostedLP].supply).dividedBy(
                  boostedLPs[boostedLP].balance,
                )}
                apy={new BigNumber(apy ?? 0)}
              />
            );
          })}
      </ul>
    </Wrap>
  );
};

export default PositionRewardsInfo;
