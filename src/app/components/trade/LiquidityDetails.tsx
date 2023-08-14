import React, { useState } from 'react';

import { BalancedJs } from '@balancednetwork/balanced-js';
import { Pair } from '@balancednetwork/v1-sdk';
import { Trans } from '@lingui/macro';
import { Accordion } from '@reach/accordion';
import BigNumber from 'bignumber.js';
import { AnimatePresence, motion } from 'framer-motion';
import JSBI from 'jsbi';
import { omit } from 'lodash-es';
import { useMedia } from 'react-use';
import { Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import Message from 'app/Message';
import { Typography } from 'app/theme';
import { ReactComponent as ArrowDownIcon } from 'assets/icons/arrow-line.svg';
import { MINIMUM_B_BALANCE_TO_SHOW_POOL } from 'constants/index';
import { BIGINT_ZERO } from 'constants/misc';
import { HIGH_PRICE_ASSET_DP } from 'constants/tokens';
import { BalanceData, useBalance, useSuppliedTokens } from 'hooks/useV2Pairs';
import { PairData, useAllPairsById } from 'queries/backendv2';
import { Source, useBBalnAmount, useSources, useTotalSupply } from 'store/bbaln/hooks';
import { useTokenListConfig } from 'store/lists/hooks';
import { Field } from 'store/mint/actions';
import { useMintActionHandlers } from 'store/mint/hooks';
import { useRewards } from 'store/reward/hooks';
import { useStakedLPPercent, useWithdrawnPercent } from 'store/stakedLP/hooks';

import { Banner } from '../Banner';
import { StyledSkeleton } from '../ProposalInfo/components';
import Spinner from '../Spinner';
import { StyledAccordionButton, StyledAccordionPanel, StyledAccordionItem } from './LiquidityDetails/Accordion';
import { StyledBoxPanel } from './LiquidityDetails/shared';
import StakeLPPanel from './LiquidityDetails/StakeLPPanel';
import { WithdrawPanel, WithdrawPanelQ, getABBalance, getShareReward } from './LiquidityDetails/WithdrawPanel';
import { usePoolPanelContext } from './PoolPanelContext';
import { getFormattedRewards, totalSupply, stakedFraction } from './utils';

export default function LiquidityDetails() {
  const upSmall = useMedia('(min-width: 800px)');
  const tokenListConfig = useTokenListConfig();
  const { data: allPairs } = useAllPairsById();
  const sources = useSources();

  const { pairs, balances } = usePoolPanelContext();

  const rewards = useRewards();

  // prevent accordion expanded on mounted
  const [isHided, setIsHided] = useState(true);

  const queuePair = pairs[BalancedJs.utils.POOL_IDS.sICXICX];
  const queueBalance = balances[BalancedJs.utils.POOL_IDS.sICXICX];
  const queueReward = rewards['sICX/ICX'];

  const shouldShowQueue =
    queuePair &&
    queueBalance &&
    (JSBI.greaterThan(queueBalance.balance.quotient, BIGINT_ZERO) ||
      (queueBalance.balance1 && JSBI.greaterThan(queueBalance.balance1.quotient, BIGINT_ZERO)));

  const pairsWithoutQ = omit(pairs, [BalancedJs.utils.POOL_IDS.sICXICX]);
  const balancesWithoutQ = omit(balances, [BalancedJs.utils.POOL_IDS.sICXICX]);
  const userPools = Object.keys(pairsWithoutQ).filter(
    poolId =>
      balances[poolId] &&
      (Number(balances[poolId].balance.toFixed()) > MINIMUM_B_BALANCE_TO_SHOW_POOL ||
        Number(balances[poolId].stakedLPBalance.toFixed()) > MINIMUM_B_BALANCE_TO_SHOW_POOL),
  );

  const sortedPairs: { [key: string]: Pair } = userPools
    .map(poolId => {
      const pair: Pair = pairsWithoutQ[poolId];

      if (pair.baseAddress === pair.token0.address) return pair;
      return new Pair(pair.reserve1, pair.reserve0, {
        poolId: pair.poolId,
        totalSupply: pair.totalSupply?.quotient.toString(),
        baseAddress: pair.baseAddress,
      });
    })
    .reduce((acc, pair) => {
      if (pair.poolId && pair.poolId > 0) acc[pair.poolId] = pair;
      return acc;
    }, {});

  const hasLiquidity = shouldShowQueue || userPools.length;
  const isLiquidityInfoLoading = shouldShowQueue === undefined;

  return (
    <>
      <AnimatePresence>
        {isLiquidityInfoLoading && (
          <motion.div
            key="spinner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ height: '100px', position: 'relative' }}
          >
            <Spinner size={75} centered></Spinner>
          </motion.div>
        )}
      </AnimatePresence>
      {hasLiquidity && (
        <TableWrapper>
          <DashGrid>
            <HeaderText>
              <Trans>Pool</Trans>
            </HeaderText>
            <HeaderText>
              <Trans>Your supply</Trans>
            </HeaderText>
            {upSmall && (
              <HeaderText>
                <Trans>BALN APY</Trans>
              </HeaderText>
            )}
            {upSmall && (
              <HeaderText>
                <Trans>Daily rewards</Trans>
              </HeaderText>
            )}
            <HeaderText></HeaderText>
          </DashGrid>

          <Accordion collapsible>
            {shouldShowQueue && (
              <StyledAccordionItem key={BalancedJs.utils.POOL_IDS.sICXICX} border={userPools.length !== 0}>
                <StyledAccordionButton onClick={() => setIsHided(false)}>
                  <PoolRecordQ
                    balance={queueBalance}
                    pair={queuePair}
                    totalReward={queueReward}
                    source={sources && sources['sICX/ICX']}
                    apy={allPairs ? allPairs[1].balnApy : 0}
                  />
                </StyledAccordionButton>
                <StyledAccordionPanel hidden={isHided}>
                  <StyledBoxPanel bg="bg3">
                    <WithdrawPanelQ
                      balance={queueBalance}
                      pair={queuePair}
                      totalReward={queueReward}
                      apy={allPairs ? allPairs[1].balnApy : 0}
                      source={sources && sources['sICX/ICX']}
                    />
                  </StyledBoxPanel>
                </StyledAccordionPanel>
              </StyledAccordionItem>
            )}
            {balancesWithoutQ &&
              userPools.map((poolId, index, arr) => (
                <StyledAccordionItem key={poolId} border={index !== arr.length - 1}>
                  <StyledAccordionButton onClick={() => setIsHided(false)}>
                    <PoolRecord
                      poolId={parseInt(poolId)}
                      balance={balances[poolId]}
                      pair={sortedPairs[poolId]}
                      pairData={allPairs && allPairs[poolId]}
                      //hotfix due to the fact that sICX/BTCB pair has wrong name on contract side
                      totalReward={
                        allPairs && allPairs[poolId]
                          ? rewards[allPairs[poolId].name === 'sICX/BTCB' ? 'BTCB/sICX' : allPairs[poolId].name]
                          : new BigNumber(0)
                      }
                      boostData={sources}
                      apy={allPairs && allPairs[parseInt(poolId)] ? allPairs[parseInt(poolId)].balnApy : 0}
                    />
                  </StyledAccordionButton>
                  <StyledAccordionPanel hidden={isHided}>
                    <StyledBoxPanel bg="bg3">
                      <StakeLPPanel pair={sortedPairs[poolId]} />
                      <WithdrawPanel poolId={parseInt(poolId)} balance={balances[poolId]} pair={sortedPairs[poolId]} />
                    </StyledBoxPanel>
                  </StyledAccordionPanel>
                </StyledAccordionItem>
              ))}
          </Accordion>
        </TableWrapper>
      )}

      {!tokenListConfig.community && (
        <Banner messageID={'communityList'} embedded>
          <Message />
        </Banner>
      )}
    </>
  );
}

const TableWrapper = styled.div``;

const DashGrid = styled.div`
  display: grid;
  grid-template-columns: 4fr 5fr;
  gap: 10px;
  grid-template-areas: 'name supply action';
  align-items: center;

  & > * {
    justify-content: flex-end;
    text-align: right;

    &:first-child {
      justify-content: flex-start;
      text-align: left;
    }
  }

  ${({ theme }) => theme.mediaWidth.upSmall`
    grid-template-columns: 1fr 1fr 1fr 1fr;
    grid-template-areas: 'name supply share rewards action';
  `}
`;

export const HeaderText = styled(Typography)`
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 3px;
`;

const DataText = styled(Flex)`
  font-size: 16px;
  justify-content: center;
  align-items: end;
  flex-direction: column;
`;

const StyledArrowDownIcon = styled(ArrowDownIcon)`
  width: 10px;
  margin-left: 10px;
  margin-top: 10px;
  transition: transform 0.3s ease;
`;

const StyledDataText = styled(Flex)`
  font-weight: bold;
`;

const ListItem = styled(DashGrid)`
  padding: 20px 0;
  color: #ffffff;
`;

const PoolRecord = ({
  poolId,
  pair,
  pairData,
  balance,
  totalReward,
  boostData,
  apy,
}: {
  pair: Pair;
  pairData?: PairData;
  balance: BalanceData;
  poolId: number;
  totalReward: BigNumber;
  boostData: { [key in string]: Source } | undefined;
  apy: number | null;
}) => {
  const upSmall = useMedia('(min-width: 800px)');
  const stakedLPPercent = useStakedLPPercent(poolId);
  const [aBalance, bBalance] = getABBalance(pair, balance);
  const pairName = `${aBalance.currency.symbol || '...'}/${bBalance.currency.symbol || '...'}`;
  const sourceName = pairName === 'sICX/BTCB' ? 'BTCB/sICX' : pairName;
  const { baseValue, quoteValue } = useWithdrawnPercent(poolId) || {};
  const balances = useBalance(poolId);
  const stakedFractionValue = stakedFraction(stakedLPPercent);
  const totalbBaln = useTotalSupply();
  const userBbaln = useBBalnAmount();
  const reward = getShareReward(
    totalReward,
    boostData && boostData[sourceName],
    balances,
    stakedFractionValue,
    totalbBaln,
    userBbaln,
  );
  const lpBalance = useSuppliedTokens(poolId, aBalance.currency, bBalance.currency);

  const baseCurrencyTotalSupply = totalSupply(baseValue, lpBalance?.base);
  const quoteCurrencyTotalSupply = totalSupply(quoteValue, lpBalance?.quote);

  const { onCurrencySelection } = useMintActionHandlers(false);

  const handlePoolClick = () => {
    if (pairData) {
      onCurrencySelection(Field.CURRENCY_A, pairData.info.baseToken);
      onCurrencySelection(Field.CURRENCY_B, pairData.info.quoteToken);
    } else {
      onCurrencySelection(Field.CURRENCY_A, pair.reserve0.currency);
      onCurrencySelection(Field.CURRENCY_B, pair.reserve1.currency);
    }
  };

  return (
    <>
      <ListItem onClick={handlePoolClick}>
        <StyledDataText>
          <DataText>{pairName}</DataText>
          <StyledArrowDownIcon />
        </StyledDataText>
        <DataText>
          {baseCurrencyTotalSupply ? (
            <Typography fontSize={16}>{`${baseCurrencyTotalSupply.toFixed(
              HIGH_PRICE_ASSET_DP[aBalance.currency.address] || 2,
              { groupSeparator: ',' },
            )} ${aBalance.currency.symbol}`}</Typography>
          ) : (
            <StyledSkeleton animation="wave" width={100}></StyledSkeleton>
          )}
          {quoteCurrencyTotalSupply ? (
            <Typography fontSize={16}>{`${quoteCurrencyTotalSupply?.toFixed(
              HIGH_PRICE_ASSET_DP[bBalance.currency.address] || 2,
              { groupSeparator: ',' },
            )} ${bBalance.currency.symbol}`}</Typography>
          ) : (
            <StyledSkeleton animation="wave" width={100}></StyledSkeleton>
          )}
        </DataText>

        {upSmall && (
          <DataText>
            {boostData ? (
              apy &&
              boostData[pairName === 'sICX/BTCB' ? 'BTCB/sICX' : pairName] &&
              boostData[pairName === 'sICX/BTCB' ? 'BTCB/sICX' : pairName].balance.isGreaterThan(0) ? (
                `${new BigNumber(apy)
                  .times(
                    //hotfix pairName due to wrong source name on contract side
                    boostData[pairName === 'sICX/BTCB' ? 'BTCB/sICX' : pairName].workingBalance.dividedBy(
                      boostData[pairName === 'sICX/BTCB' ? 'BTCB/sICX' : pairName].balance,
                    ),
                  )
                  .times(100)
                  .toFormat(2)}%`
              ) : (
                '-'
              )
            ) : (
              <StyledSkeleton animation="wave" width={100}></StyledSkeleton>
            )}
          </DataText>
        )}
        {upSmall && (
          //hotfix pairName due to wrong source name on contract side
          <DataText>{getFormattedRewards(reward)}</DataText>
        )}
      </ListItem>
    </>
  );
};

const PoolRecordQ = ({
  balance,
  pair,
  totalReward,
  source,
  apy,
}: {
  balance: BalanceData;
  pair: Pair;
  totalReward: BigNumber;
  source?: Source | undefined;
  apy: number | null;
}) => {
  const upSmall = useMedia('(min-width: 800px)');

  const reward = getShareReward(totalReward, source);

  const { onCurrencySelection } = useMintActionHandlers(false);

  const handlePoolClick = () => {
    onCurrencySelection(Field.CURRENCY_A, pair.reserve0.currency);
    onCurrencySelection(Field.CURRENCY_B, pair.reserve1.currency);
  };

  return (
    <ListItem onClick={handlePoolClick}>
      <StyledDataText>
        <DataText>{`${balance.balance.currency.symbol || '...'}/${
          balance.balance1?.currency.symbol || '...'
        }`}</DataText>
        <StyledArrowDownIcon />
      </StyledDataText>

      <DataText>
        <Typography fontSize={16}>{`${balance.balance.toFixed(2, { groupSeparator: ',' }) || '...'} ${
          balance.balance.currency.symbol || '...'
        }`}</Typography>
        <Typography color="text1">{`${balance.balance1?.toFixed(2, { groupSeparator: ',' }) || '...'} ${
          balance.balance1?.currency.symbol || '...'
        }`}</Typography>
      </DataText>
      {upSmall && (
        <DataText>{`${
          apy && source
            ? new BigNumber(apy)
                .times(100)
                .times(source.workingBalance.div(source.balance) || 1)
                .toFormat(2)
            : '-'
        }%`}</DataText>
      )}
      {upSmall && <DataText>{`~ ${reward.toFormat(2, BigNumber.ROUND_HALF_UP) || '-'} BALN`}</DataText>}
    </ListItem>
  );
};
