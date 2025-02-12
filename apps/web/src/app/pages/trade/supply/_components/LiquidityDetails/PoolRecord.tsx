import React, { useMemo } from 'react';

import { Pair } from '@balancednetwork/v1-sdk';
import { Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { useMedia } from 'react-use';
import { Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Typography } from '@/app/theme';
import ArrowDownIcon from '@/assets/icons/arrow-line.svg';
import { Pool, usePoolTokenAmounts } from '@/hooks/useV2Pairs';
import { PairData } from '@/queries/backendv2';
import { Source, useBBalnAmount, useTotalSupply } from '@/store/bbaln/hooks';
import { useMintActionHandlers } from '@/store/mint/hooks';
import { Field } from '@/store/mint/reducer';
import { useStakedLPPercent, useWithdrawnPercent } from '@/store/stakedLP/hooks';

import PoolLogoWithNetwork from '@/app/components/PoolLogoWithNetwork';
import RewardsDisplay from '@/app/components/RewardsDisplay/RewardsDisplay';
import Skeleton from '@/app/components/Skeleton';
import { useIncentivisedPairs, useRatesWithOracle } from '@/queries/reward';
import { useEmissions } from '@/store/reward/hooks';
import { formatBigNumber } from '@/utils';
import { formatSymbol, getFormattedNumber } from '@/utils/formatter';
import { CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import { getFormattedExternalRewards, getFormattedRewards, stakedFraction, totalSupply } from '../utils';
import { getExternalShareReward, getShareReward } from './WithdrawPanel';

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

export const PoolRecord = ({
  poolId,
  pool,
  pair,
  pairData,
  balnReward,
  boostData,
  externalRewards,
}: {
  pool: Pool;
  pair: Pair;
  pairData?: PairData;
  poolId: number;
  balnReward: BigNumber;
  externalRewards: CurrencyAmount<Token>[] | undefined;
  boostData: { [key in string]: Source } | undefined;
  apy: number | null;
}) => {
  const { xChainId } = pool;
  const [baseAmount, quoteAmount] = usePoolTokenAmounts(pool);

  const upSmall = useMedia('(min-width: 800px)');
  const prices = useRatesWithOracle();
  const stakedLPPercent = useStakedLPPercent(poolId); // TODO
  const pairName = `${formatSymbol(baseAmount.currency.symbol) || '...'}/${formatSymbol(quoteAmount.currency.symbol) || '...'}`;
  const sourceName = pairName === 'sICX/BTCB' ? 'BTCB/sICX' : pairName;

  const { baseValue: baseWithdrawValue, quoteValue: quoteWithdrawValue } = useWithdrawnPercent(poolId) || {};
  const stakedFractionValue = stakedFraction(stakedLPPercent);
  const totalbBaln = useTotalSupply();
  const userBbaln = useBBalnAmount();
  const reward = getShareReward(
    balnReward,
    boostData && boostData[sourceName],
    pool,
    stakedFractionValue,
    totalbBaln,
    userBbaln,
  );

  const { data: dailyEmissions } = useEmissions();
  const { data: incentivisedPairs } = useIncentivisedPairs();

  const xDailyReward = useMemo(() => {
    const pair = incentivisedPairs?.find(pair => pair.id === pool.poolId);
    if (pair && pool.stakedLPBalance && dailyEmissions) {
      return new BigNumber(
        new BigNumber(pool.stakedLPBalance.toFixed())
          .times(10 ** pool.stakedLPBalance.currency.decimals)
          .div(pair.totalStaked)
          .times(dailyEmissions.times(pair.rewards.toFixed(8))),
      );
    }

    return new BigNumber(0);
  }, [pool, incentivisedPairs, dailyEmissions]);

  const baseSupplyAmount = totalSupply(baseWithdrawValue, baseAmount);
  const quoteSupplyAmount = totalSupply(quoteWithdrawValue, quoteAmount);

  const { onCurrencySelection, onChainSelection } = useMintActionHandlers(false);

  const handlePoolClick = () => {
    onCurrencySelection(Field.CURRENCY_A, pair.reserve0.currency);
    onCurrencySelection(Field.CURRENCY_B, pair.reserve1.currency);
    onChainSelection(Field.CURRENCY_A, xChainId);
  };

  return (
    <>
      <ListItem onClick={handlePoolClick}>
        <Flex alignItems={'center'}>
          <PoolLogoWithNetwork
            chainId={xChainId}
            baseCurrency={baseAmount.currency}
            quoteCurrency={quoteAmount.currency}
          />
          {upSmall && <DataText ml={2}>{pairName}</DataText>}
          <StyledArrowDownIcon />
        </Flex>
        <DataText>
          {baseSupplyAmount ? (
            <Typography fontSize={16}>{`${formatBigNumber(
              new BigNumber(baseSupplyAmount?.toFixed() || 0),
              'currency',
            )} ${formatSymbol(baseAmount.currency.symbol)}`}</Typography>
          ) : (
            <Skeleton width={100}></Skeleton>
          )}
          {quoteSupplyAmount ? (
            <Typography fontSize={16}>{`${formatBigNumber(
              new BigNumber(quoteSupplyAmount?.toFixed() || 0),
              'currency',
            )} ${formatSymbol(quoteAmount.currency.symbol)}`}</Typography>
          ) : (
            <Skeleton width={100}></Skeleton>
          )}
        </DataText>

        {upSmall && (
          <DataText>
            <DataText>
              {pairData && <RewardsDisplay pair={pairData} boost={boostData} xChainId={xChainId} />}
              {pairData?.feesApy && (
                <APYItem>
                  <Typography color="#d5d7db" fontSize={14} marginRight={'5px'}>
                    <Trans>Fees:</Trans>
                  </Typography>
                  {getFormattedNumber(pairData.feesApy, 'percent2')}
                </APYItem>
              )}
            </DataText>
          </DataText>
        )}
        {upSmall && (
          <DataText>
            <Typography fontSize={16}>
              {xChainId === '0x1.icon'
                ? getFormattedRewards(reward, !externalRewards || externalRewards.length === 0)
                : getFormattedRewards(xDailyReward, true)}
            </Typography>
            {xChainId === '0x1.icon' && externalRewards
              ? externalRewards.map(reward => {
                  const rewardPrice = prices?.[reward.currency.wrapped.symbol];
                  const rewardShare = getExternalShareReward(reward, pool, stakedFractionValue, pairData?.stakedLP);
                  return (
                    <Typography key={reward.currency.symbol} fontSize={16}>
                      {getFormattedExternalRewards(rewardShare, rewardPrice?.toFixed())}
                    </Typography>
                  );
                })
              : null}
          </DataText>
        )}
      </ListItem>
    </>
  );
};
