import React, { useMemo, useState } from 'react';

import { useDaoBBALNData } from '@/queries';
import { Box, Flex } from 'rebass';
import styled, { css } from 'styled-components';

import QuestionIcon from '@/assets/icons/question.svg';
import { BoxPanel, FlexPanel } from '@/components/Panel';
import QuestionHelper, { QuestionWrapper } from '@/components/QuestionHelper';
import { LoaderComponent } from '@/pages/PerformanceDetails/utils';
import { StyledSkeleton } from '@/sections/TokenSection';
import { Typography } from '@/theme';

const RewardsPanelLayout = styled(FlexPanel)`
  padding: 0 !important;
  grid-area: initial;
  flex-direction: column;

  @media screen and (min-width: 600px) {
    padding: 0;
  }

  @media screen and (min-width: 1000px) {
    padding: 0;
    grid-column: 1 / span 2;
    flex-direction: row;
  }
`;

const LockedBar = styled(Box)<{ lockedWidth: number }>`
  height: 15px;
  width: 100%;
  border-radius: 5px;
  background-color: ${({ theme }) => theme.colors.bg3};
  position: relative;
  overflow: hidden;
  margin-top: 50px;

  &:before {
    content: '';
    height: 100%;
    width: ${({ lockedWidth }) => `${lockedWidth}%`};
    top: 0;
    left: 0;
    position: absolute;
    display: inline-block;
    background-color: ${({ theme }) => theme.colors.primary};
  }
`;

const BoostedInfo = styled(Flex)<{ showBorder?: boolean }>`
  ${({ showBorder }) =>
    showBorder &&
    css`
      margin-top: 15px !important;
      padding-top: 15px;
      border-top: 1px solid rgba(255, 255, 255, 0.15);
    `};

  width: 100%;
  position: relative;
  flex-wrap: wrap;
`;

const BoostedBox = styled(Flex)`
  border-right: 1px solid rgba(255, 255, 255, 0.15);
  flex-flow: column;
  justify-content: center;
  align-items: center;
  padding: 0 10px;
  width: 50%;
  &.no-border {
    border-right: 0;
  }
  @media screen and (max-width: 600px) {
    width: 100%;
    border-right: 0;
    margin-bottom: 20px !important;
    &.no-border {
      border-right: 0;
      margin-bottom: 0 !important;
    }
  }
`;

const PoolItem = styled(Flex)`
  min-width: 160px !important;
  width: 100%;
  max-width: 25%;
  padding: 15px 15px 0 15px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  @media screen and (max-width: 600px) {
    max-width: 33.333%;
  }
  @media screen and (max-width: 500px) {
    max-width: 50%;
  }
  @media screen and (max-width: 360px) {
    max-width: 100%;
  }
`;

const LiquidityDetailsWrap = styled(Box)<{ show?: boolean }>`
  display: flex;
  justify-content: center;
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 20px !important;
  text-align: right;
  opacity: 0;
  z-index: -1;
  pointer-events: none;
  transition: all ease 0.2s;
  width: 100%;
  @media (min-width: 600px) {
    max-width: 50%;
  }
  ${({ show }) =>
    show &&
    css`
      opacity: 1;
      z-index: 1;
      pointer-events: all;
    `}
  &:before {
    content: '';
    width: 0;
    height: 0;
    border-left: 12px solid transparent;
    border-right: 12px solid transparent;
    border-bottom: 12px solid ${({ theme }) => theme.colors.primary};
    position: absolute;
    bottom: 100%;
    margin-bottom: -2px;
    right: calc(50% - 13px);
    @media screen and (max-width: 600px) {
      right: calc(50% - 12px);
    }
  }
`;

const LiquidityDetails = styled(Flex)`
  display: inline-flex;
  justify-content: center;
  flex-wrap: wrap;
  padding: 0 15px 15px 15px;
  background: ${({ theme }) => theme.colors.bg2};
  border: 2px solid ${({ theme }) => theme.colors.primary};
  border-radius: 10px;
  width: auto;
`;

const StyledTypography = styled(Typography)`
  position: relative;
  padding: 0 20px;
  margin: 0 -20px;
  svg {
    position: absolute;
    right: 0;
    top: 3px;
    cursor: help;
  }
`;

const BBALNSection = () => {
  const [showLiquidityTooltip, setShowLiquidityTooltip] = useState(false);
  const { data: daoBBALNData } = useDaoBBALNData();

  const balnLocked = daoBBALNData?.BALNDaoLocked;
  const daoSources = daoBBALNData?.DAOSources;

  const showLPTooltip = () => {
    setShowLiquidityTooltip(true);
  };

  const hideLPTooltip = () => {
    setShowLiquidityTooltip(false);
  };

  const boostedLPNumbers = useMemo(
    () =>
      daoSources &&
      Object.values(daoSources).map(boostedLP =>
        boostedLP.workingBalance.dividedBy(boostedLP.balance).dp(2).toNumber(),
      ),
    [daoSources],
  );

  return (
    <RewardsPanelLayout bg="bg2" mb={10}>
      <BoxPanel bg="bg3" flex={1} maxWidth={['initial', 'initial', 'initial', 350]}>
        <Typography variant="h2" mb={'20px'}>
          Rewards
        </Typography>

        <Flex width="100%">
          <Flex flexGrow={1} flexDirection="column" alignItems="center" className="border-right">
            <Typography fontSize={14} color="text2">
              Liquidity rewards
            </Typography>
            <Flex mt={2} alignItems="center">
              {daoBBALNData ? (
                <>
                  <Typography fontSize={16} color="text">
                    {daoBBALNData?.DAORewards.baln.toFixed(2, { groupSeparator: ',' })}
                  </Typography>
                  <Typography color="text2" ml={1} pt={'1px'}>
                    BALN
                  </Typography>
                </>
              ) : (
                <StyledSkeleton animation="wave" width={120}></StyledSkeleton>
              )}
            </Flex>
          </Flex>
          <Flex flexGrow={1} flexDirection="column" alignItems="center">
            <Typography fontSize={14} color="text2">
              Network fees
            </Typography>
            <Flex mt={2} flexDirection="column">
              {daoBBALNData ? (
                Object.values(daoBBALNData.DAORewards.fees).map((feeItem, index) => (
                  <Flex alignItems="center" key={index}>
                    <Typography fontSize={16} color="text">
                      {feeItem.toFixed(2, { groupSeparator: ',' })}
                    </Typography>
                    <Typography color="text2" ml={1} pt={'1px'}>
                      {feeItem.currency.symbol}
                    </Typography>
                  </Flex>
                ))
              ) : (
                <>
                  <StyledSkeleton animation="wave" width={120} />
                  <StyledSkeleton animation="wave" width={120} />
                  <StyledSkeleton animation="wave" width={120} />
                </>
              )}
            </Flex>
          </Flex>
        </Flex>
        <Typography textAlign="center" color="text2" mt={'13px'}>
          Available to claim via smart contract.
        </Typography>
      </BoxPanel>

      <BoxPanel bg="bg2" flex={1}>
        <Box mb="28px">
          <Flex alignItems="flex-end" flexWrap="wrap">
            <Typography variant="h3" paddingRight={'10px'}>
              Boosted BALN
            </Typography>
            {daoBBALNData && (
              <Typography color="text2" padding="0 3px 2px 0">{`${daoBBALNData.BBALNDaoHolding.toFormat(
                0,
              )} bBALN`}</Typography>
            )}
          </Flex>
        </Box>
        <LockedBar lockedWidth={100} />
        <Flex justifyContent="space-between" mt="13px" flexWrap="wrap">
          <Flex mb={1}>
            {balnLocked ? (
              <Typography color="text2" pr={3}>
                {`${balnLocked?.toFormat(0)} / ${balnLocked?.toFormat(0)} BALN`}
                <QuestionWrapper margin="0 0 0 2px" style={{ transform: 'translateY(1px)' }}>
                  <QuestionHelper text="Only includes BALN earned via liquidity rewards, not the BALN held in the DAO Fund."></QuestionHelper>
                </QuestionWrapper>
              </Typography>
            ) : (
              <StyledSkeleton animation="wave" width={170}></StyledSkeleton>
            )}
          </Flex>
          {daoBBALNData && daoBBALNData.BALNLockEnd ? (
            <Typography color="text2" mb={1}>
              {` Locked until ${daoBBALNData.BALNLockEnd.toLocaleDateString('en-GB', {
                month: 'short',
                day: '2-digit',
                year: 'numeric',
              }).replace(',', '')}`}
            </Typography>
          ) : (
            <StyledSkeleton animation="wave" width={190}></StyledSkeleton>
          )}
        </Flex>
        <BoostedInfo showBorder>
          <BoostedBox>
            <Typography fontSize={16} color="#FFF">
              {daoBBALNData
                ? `${daoBBALNData?.BBALNDaoHolding.dividedBy(daoBBALNData.BBALNTotalSupply).times(100).toPrecision(3)}%`
                : '-'}
            </Typography>
            <Typography>Network fees</Typography>
          </BoostedBox>
          <BoostedBox className="no-border">
            <Typography fontSize={16} color="#FFF">
              {boostedLPNumbers
                ? boostedLPNumbers.length !== 0
                  ? boostedLPNumbers.length === 1 || Math.min(...boostedLPNumbers) === Math.max(...boostedLPNumbers)
                    ? `${boostedLPNumbers[0].toFixed(2)} x`
                    : `${Math.min(...boostedLPNumbers).toFixed(2)} x - ${Math.max(...boostedLPNumbers).toFixed(2)} x`
                  : 'N/A'
                : '-'}
            </Typography>
            <StyledTypography>
              Liquidity rewards{' '}
              {daoSources && (
                <QuestionIcon
                  width={14}
                  onMouseEnter={showLPTooltip}
                  onMouseLeave={hideLPTooltip}
                  onTouchStart={showLPTooltip}
                />
              )}
            </StyledTypography>
          </BoostedBox>
          <LiquidityDetailsWrap show={showLiquidityTooltip}>
            <LiquidityDetails>
              {daoSources &&
                Object.keys(daoSources).map(boostedLP => {
                  return (
                    <PoolItem key={boostedLP}>
                      <Typography fontSize={16} color="#FFF" style={{ whiteSpace: 'nowrap' }}>
                        {boostedLP.replace('/', ' / ')}
                      </Typography>
                      <Typography fontSize={14} style={{ whiteSpace: 'nowrap' }}>
                        {`${daoSources[boostedLP].workingBalance
                          .dividedBy(daoSources[boostedLP].balance)
                          .toFixed(2)} x`}
                        {daoSources[boostedLP].apy.isGreaterThan(0) ? (
                          ` (${daoSources[boostedLP].apy}% APR)`
                        ) : (
                          <>
                            {' ('}
                            <LoaderComponent />
                            {' )'}
                          </>
                        )}
                      </Typography>
                    </PoolItem>
                  );
                })}
            </LiquidityDetails>
          </LiquidityDetailsWrap>
        </BoostedInfo>
      </BoxPanel>
    </RewardsPanelLayout>
  );
};

export default BBALNSection;
