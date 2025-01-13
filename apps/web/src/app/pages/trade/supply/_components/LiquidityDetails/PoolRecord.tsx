import React from 'react';

import { Pair } from '@balancednetwork/v1-sdk';
import { Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { useMedia } from 'react-use';
import { Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Typography } from '@/app/theme';
import ArrowDownIcon from '@/assets/icons/arrow-line.svg';
import { Pool, useBalance, usePoolTokenAmounts } from '@/hooks/useV2Pairs';
import { PairData } from '@/queries/backendv2';
import { Source, useBBalnAmount, useTotalSupply } from '@/store/bbaln/hooks';
import { useMintActionHandlers } from '@/store/mint/hooks';
import { Field } from '@/store/mint/reducer';
import { useStakedLPPercent, useWithdrawnPercent } from '@/store/stakedLP/hooks';

import PoolLogoWithNetwork from '@/app/components/PoolLogoWithNetwork';
import Skeleton from '@/app/components/Skeleton';
import { formatBigNumber } from '@/utils';
import { getFormattedNumber } from '@/utils/formatter';
import { getFormattedRewards, stakedFraction, totalSupply } from '../utils';
import { getShareReward } from './WithdrawPanel';

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
  totalReward,
  boostData,
  apy,
}: {
  pool: Pool;
  pair: Pair;
  pairData?: PairData;
  poolId: number;
  totalReward: BigNumber;
  boostData: { [key in string]: Source } | undefined;
  apy: number | null;
}) => {
  const { xChainId } = pool;
  const [baseAmount, quoteAmount] = usePoolTokenAmounts(pool);

  const upSmall = useMedia('(min-width: 800px)');
  const stakedLPPercent = useStakedLPPercent(poolId); // TODO
  const pairName = `${baseAmount.currency.symbol || '...'}/${quoteAmount.currency.symbol || '...'}`;
  const sourceName = pairName === 'sICX/BTCB' ? 'BTCB/sICX' : pairName;

  const { baseValue: baseWithdrawValue, quoteValue: quoteWithdrawValue } = useWithdrawnPercent(poolId) || {};
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
          <DataText>
            <PoolLogoWithNetwork
              chainId={xChainId}
              baseCurrency={baseAmount.currency}
              quoteCurrency={quoteAmount.currency}
            />
          </DataText>
          <StyledArrowDownIcon />
        </Flex>
        <DataText>
          {baseSupplyAmount ? (
            <Typography fontSize={16}>{`${formatBigNumber(
              new BigNumber(baseSupplyAmount?.toFixed() || 0),
              'currency',
            )} ${baseAmount.currency.symbol}`}</Typography>
          ) : (
            <Skeleton width={100}></Skeleton>
          )}
          {quoteSupplyAmount ? (
            <Typography fontSize={16}>{`${formatBigNumber(
              new BigNumber(quoteSupplyAmount?.toFixed() || 0),
              'currency',
            )} ${quoteAmount.currency.symbol}`}</Typography>
          ) : (
            <Skeleton width={100}></Skeleton>
          )}
        </DataText>

        {upSmall && (
          <DataText>
            {boostData ? (
              apy &&
              boostData[pairName === 'sICX/BTCB' ? 'BTCB/sICX' : pairName] &&
              boostData[pairName === 'sICX/BTCB' ? 'BTCB/sICX' : pairName].balance.isGreaterThan(0) ? (
                <>
                  <APYItem>
                    <Typography color="#d5d7db" fontSize={14} marginRight={'5px'}>
                      BALN:
                    </Typography>
                    {new BigNumber(apy)
                      .times(
                        //hotfix pairName due to wrong source name on contract side
                        boostData[pairName === 'sICX/BTCB' ? 'BTCB/sICX' : pairName].workingBalance.dividedBy(
                          boostData[pairName === 'sICX/BTCB' ? 'BTCB/sICX' : pairName].balance,
                        ),
                      )
                      .times(100)
                      .toFormat(2)}
                    %
                  </APYItem>

                  {pairData?.feesApy && (
                    <APYItem>
                      <Typography color="#d5d7db" fontSize={14} marginRight={'5px'}>
                        <Trans>Fees:</Trans>
                      </Typography>
                      {getFormattedNumber(pairData.feesApy, 'percent2')}
                    </APYItem>
                  )}
                </>
              ) : (
                '-'
              )
            ) : (
              <Skeleton width={100}></Skeleton>
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
