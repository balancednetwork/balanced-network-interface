import { MouseoverTooltip } from '@/app/components/Tooltip';
import { APYItem } from '@/app/pages/trade/supply/_components/AllPoolsPanel';
import { getRewardApr } from '@/app/pages/trade/supply/_components/utils';
import { Typography } from '@/app/theme';
import QuestionIcon from '@/assets/icons/question.svg';
import { PairData } from '@/queries/backendv2';
import { useRatesWithOracle } from '@/queries/reward';
import { Source } from '@/store/bbaln/hooks';
import { formatValue } from '@/utils/formatter';
import { Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import React, { Fragment, useMemo } from 'react';
import { Flex } from 'rebass/styled-components';
import styled from 'styled-components';

type RewardsDisplayProps = {
  pair: PairData;
  boost?: {
    [x: string]: Source;
  };
};

const Wrapper = styled(Flex)`
  align-items: center;
`;

const TooltipContent = ({
  balnApy,
  externalApy,
  pair,
  prices,
}: {
  balnApy: number;
  externalApy: number;
  pair: PairData;
  prices: Record<string, BigNumber>;
}) => (
  <>
    <Typography>
      <span>{`Paid in BALN`}</span>
      {externalApy > 0 && (
        <>
          {/* Show BALN range only if there are external rewards, as well */}
          <span style={{ opacity: 0.75 }}>
            {' ('}
            {`${formatValue(balnApy.toFixed(4)).replace('$', '')}% - ${formatValue((balnApy * 2.5).toFixed(4)).replace(
              '$',
              '',
            )}%`}
            {')'}
          </span>
          <span> {`and `}</span>

          {pair.externalRewards?.map((reward, index) => (
            <Fragment key={index}>
              {reward.currency.symbol}{' '}
              <span style={{ opacity: 0.75 }}>
                (
                {formatValue(
                  getRewardApr(reward, pair, prices?.[reward.currency.symbol]?.toNumber() || 0).toFixed(),
                ).replace('$', '')}
                %)
              </span>
            </Fragment>
          ))}
        </>
      )}
      .
      {(!externalApy || externalApy === 0) && (
        <>
          {' '}
          <Trans>Your rate depends on your position size and the amount of bBALN you hold.</Trans>
        </>
      )}
    </Typography>
    {externalApy > 0 && (
      <Typography mt={'15px'}>
        <Trans>Your BALN rate depends on your position size and the amount of bBALN you hold.</Trans>
      </Typography>
    )}
  </>
);

const RewardsDisplay: React.FC<RewardsDisplayProps> = ({ pair, boost }) => {
  const prices = useRatesWithOracle();
  const pairName = pair.name;
  const pairBoost = useMemo(() => {
    if (boost) {
      const pairBoostData = boost[pairName];
      return pairBoostData ? pairBoostData.workingBalance.dividedBy(pairBoostData.balance).toNumber() : undefined;
    }
  }, [boost, pairName]);

  if (!prices) return null;

  const externalApy = pair.externalRewardsTotalAPR;

  const balnApy = pair.balnApy * 100 || 0;
  const totalApy = balnApy + externalApy;

  if (totalApy <= 0) return null;

  // If balnApy is 0, we don't need to show the balnApy, just show the external rewards
  if (balnApy === 0) {
    return (
      <Wrapper>
        {pair.externalRewards?.map((reward, index) => (
          <APYItem key={index} ml="7px">
            <Typography color="#d5d7db" fontSize={14} marginRight={'5px'}>
              {reward.currency.symbol}:{' '}
            </Typography>
            {formatValue(
              getRewardApr(reward, pair, prices?.[reward.currency.symbol]?.toNumber() || 0).toFixed(),
            ).replace('$', '')}
            %
          </APYItem>
        ))}
      </Wrapper>
    );
  }

  //if there is only baln APR, show the BALN APR and no tooltip
  if (!pair.externalRewards || pair.externalRewards.length === 0) {
    return (
      <Wrapper>
        <APYItem ml="7px">
          <Typography color="#d5d7db" fontSize={14} marginRight={'5px'}>
            <Trans>BALN:</Trans>
          </Typography>
          {pairBoost
            ? `${formatValue((balnApy * pairBoost + externalApy).toFixed(4)).replace('$', '')}%`
            : `${formatValue((balnApy + externalApy).toFixed(4)).replace('$', '')}% - ${formatValue(
                (balnApy * 2.5 + externalApy).toFixed(4),
              ).replace('$', '')}%`}
        </APYItem>
      </Wrapper>
    );
  }

  // If there are external rewards, show the BALN APR and the external rewards
  return (
    <Wrapper>
      <MouseoverTooltip
        placement="top"
        text={<TooltipContent balnApy={balnApy} externalApy={externalApy} pair={pair} prices={prices} />}
        width={275}
      >
        <QuestionIcon width={14} style={{ marginLeft: '5px', cursor: 'pointer', opacity: 0.9 }} />
      </MouseoverTooltip>
      <APYItem ml="7px">
        <Typography color="#d5d7db" fontSize={14} marginRight={'5px'}>
          <Trans>Rewards:</Trans>
        </Typography>
        {/* Show boosted value instead of a range if user has a position */}
        {pairBoost
          ? `${formatValue((balnApy * pairBoost + externalApy).toFixed(4)).replace('$', '')}%`
          : `${formatValue((balnApy + externalApy).toFixed(4)).replace('$', '')}% - ${formatValue(
              (balnApy * 2.5 + externalApy).toFixed(4),
            ).replace('$', '')}%`}
      </APYItem>
    </Wrapper>
  );
};

export default RewardsDisplay;
