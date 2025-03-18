import React, { useState } from 'react';

import { BalancedJs } from '@balancednetwork/balanced-js';
import { Trans } from '@lingui/macro';
import { Accordion } from '@reach/accordion';
import BigNumber from 'bignumber.js';
import { AnimatePresence, motion } from 'framer-motion';
import { omit } from 'lodash-es';
import { useMedia } from 'react-use';
import { Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import Message from '@/app/Message';
import { Typography } from '@/app/theme';
import ArrowDownIcon from '@/assets/icons/arrow-line.svg';
import { MINIMUM_B_BALANCE_TO_SHOW_POOL } from '@/constants/index';
import { useAllPairsById } from '@/queries/backendv2';
import { useSources } from '@/store/bbaln/hooks';
import { useTokenListConfig } from '@/store/lists/hooks';
import { useRewards } from '@/store/reward/hooks';

import { QuestionWrapper } from '@/app/components/QuestionHelper';
import { MouseoverTooltip } from '@/app/components/Tooltip';
import QuestionIcon from '@/assets/icons/question.svg';
import { Banner } from '../../../../components/Banner';
import Spinner from '../../../../components/Spinner';
import { StyledAccordionButton, StyledAccordionItem, StyledAccordionPanel } from './LiquidityDetails/Accordion';
import { PoolRecord } from './LiquidityDetails/PoolRecord';
import StakeLPPanel from './LiquidityDetails/StakeLPPanel';
import { WithdrawPanel } from './LiquidityDetails/WithdrawPanel';
import { StyledBoxPanel } from './LiquidityDetails/shared';
import { usePoolPanelContext } from './PoolPanelContext';

export default function LiquidityDetails() {
  const upSmall = useMedia('(min-width: 800px)');
  const tokenListConfig = useTokenListConfig();
  const { data: allPairs } = useAllPairsById();
  const sources = useSources();

  const { pairs, balances, pools } = usePoolPanelContext();

  const rewards = useRewards();

  // prevent accordion expanded on mounted
  const [isHided, setIsHided] = useState(true);

  const poolBalances = omit(balances, [BalancedJs.utils.POOL_IDS.sICXICX]);

  const userPools = pools.filter(
    pool =>
      Number(pool.balance.toFixed()) > MINIMUM_B_BALANCE_TO_SHOW_POOL ||
      Number(pool.stakedLPBalance?.toFixed()) > MINIMUM_B_BALANCE_TO_SHOW_POOL,
  );

  const hasLiquidity = !!userPools.length;
  const isLiquidityInfoLoading = userPools.length === 0;

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
            <Spinner size={75} $centered></Spinner>
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
                <MouseoverTooltip
                  width={330}
                  text={
                    <>
                      <Trans>
                        Based on the USD value of liquidity rewards (claimable from the Home page) and fees earned by a
                        pool over the past 30 days.
                      </Trans>
                      <br />
                      <br />
                      <Trans>
                        BALN rewards depend on your position size and bBALN holdings (boost available on ICON only).
                      </Trans>
                    </>
                  }
                  placement="top"
                  strategy="absolute"
                >
                  <QuestionWrapper>
                    <QuestionIcon className="header-tooltip" width={14} />
                  </QuestionWrapper>
                </MouseoverTooltip>

                <Trans>APR</Trans>
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
            {poolBalances &&
              userPools.map((pool, index) => (
                <StyledAccordionItem key={`${pool.poolId}-${pool.xChainId}`} $border={index !== userPools.length - 1}>
                  <StyledAccordionButton onClick={() => setIsHided(false)}>
                    <PoolRecord
                      poolId={pool.poolId}
                      pool={pool}
                      pair={pairs[pool.poolId]}
                      pairData={allPairs && allPairs[pool.poolId]}
                      //hotfix due to the fact that sICX/BTCB pair has wrong name on contract side
                      balnReward={
                        allPairs && allPairs[pool.poolId]
                          ? rewards[
                              allPairs[pool.poolId].name === 'sICX/BTCB' ? 'BTCB/sICX' : allPairs[pool.poolId].name
                            ]
                          : new BigNumber(0)
                      }
                      externalRewards={allPairs && allPairs[pool.poolId] ? allPairs[pool.poolId].externalRewards : []}
                      boostData={sources}
                      apy={allPairs && allPairs[pool.poolId] ? allPairs[pool.poolId].balnApy : 0}
                    />
                  </StyledAccordionButton>
                  <StyledAccordionPanel hidden={isHided}>
                    <StyledBoxPanel bg="bg3">
                      <StakeLPPanel pool={pool} />
                      <WithdrawPanel pool={pool} />
                    </StyledBoxPanel>
                  </StyledAccordionPanel>
                </StyledAccordionItem>
              ))}
          </Accordion>
        </TableWrapper>
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
  display: flex;
  gap: 5px;
  align-items: center;
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

const APYItem = styled(Flex)`
  align-items: flex-end;
  line-height: 25px;
`;
