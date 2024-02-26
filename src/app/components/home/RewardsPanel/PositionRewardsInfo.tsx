import React from 'react';

import BigNumber from 'bignumber.js';
import styled from 'styled-components';

import { Typography } from 'app/theme';
import { useAllPairs } from 'queries/backendv2';
import { useIncentivisedPairs } from 'queries/reward';
import { Source, useSources, useWorkingBalance } from 'store/bbaln/hooks';
import { useLoanAPY } from 'store/loan/hooks';

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
  const sources = useSources();
  const { data: incentivisedPairs } = useIncentivisedPairs();
  const rewardsAPY = useLoanAPY();
  const { data: allPairs } = useAllPairs();

  const boostedLPs = React.useMemo(() => {
    if (sources && incentivisedPairs) {
      const pairNames = incentivisedPairs.map(pair => pair.name);
      return Object.keys(sources).reduce((LPs, sourceName) => {
        if (pairNames.indexOf(sourceName) >= 0 && sources[sourceName].balance.isGreaterThan(0)) {
          LPs[sourceName] = { ...sources[sourceName] };
        }
        return LPs;
      }, {} as { [key in string]: Source });
    }
  }, [sources, incentivisedPairs]);

  const boostedLPNumbers = React.useMemo(
    () =>
      boostedLPs &&
      Object.values(boostedLPs).map(boostedLP =>
        getWorkingBalance(boostedLP.balance, boostedLP.supply).dividedBy(boostedLP.balance).dp(2).toNumber(),
      ),
    [boostedLPs, getWorkingBalance],
  );

  const loanBoost =
    sources && getWorkingBalance(sources.Loans.balance, sources.Loans.supply).dividedBy(sources.Loans.balance);

  return (
    <Wrap>
      <Typography mt={3}>Your return:</Typography>
      <ul>
        {sources && !sources.Loans.balance.isEqualTo(0) && (
          <li>
            <SourceInfo name="Loans" boost={loanBoost} apy={rewardsAPY} />
          </li>
        )}
        {boostedLPNumbers !== undefined &&
          boostedLPNumbers?.length !== 0 &&
          boostedLPs &&
          Object.keys(boostedLPs).map(boostedLP => {
            const apy = allPairs?.find(pair => pair.name === boostedLP)?.balnApy;
            return (
              <li key={boostedLP}>
                <SourceInfo
                  name={boostedLP}
                  boost={getWorkingBalance(boostedLPs[boostedLP].balance, boostedLPs[boostedLP].supply).dividedBy(
                    boostedLPs[boostedLP].balance,
                  )}
                  apy={new BigNumber(apy ?? 0)}
                />
              </li>
            );
          })}
      </ul>
    </Wrap>
  );
};

export default PositionRewardsInfo;
