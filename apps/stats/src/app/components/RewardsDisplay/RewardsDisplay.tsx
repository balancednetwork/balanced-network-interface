import QuestionIcon from '@/assets/icons/question.svg';
import { MouseoverTooltip } from '@/components/Tooltip';
import { Pair, useTokenPrices } from '@/queries/backendv2';
import { Typography } from '@/theme';
import { formatValue, getRewardApr } from '@/utils';
import BigNumber from 'bignumber.js';
import React, { Fragment } from 'react';
import { Flex } from 'rebass';
import styled from 'styled-components';

type RewardsDisplayProps = {
  pair: Pair;
};

const Wrapper = styled(Flex)`
  align-items: center;
`;

export const APYItem = styled(Flex)`
  align-items: flex-end;
  line-height: 25px;
`;

const TooltipContent = ({
  balnApy,
  externalApy,
  pair,
  prices,
}: {
  balnApy: number;
  externalApy: number;
  pair: Pair;
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
            {`${formatValue(balnApy.toFixed(4), false)}% - ${formatValue((balnApy * 2.5).toFixed(4), false)}%`}
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
                  false,
                )}
                %)
              </span>
            </Fragment>
          ))}
        </>
      )}
      .
      {(!externalApy || externalApy === 0) &&
        ' Your rate depends on your position size and the amount of bBALN you hold.'}
    </Typography>
    {externalApy > 0 && (
      <Typography mt={'15px'}>
        Your BALN rate depends on your position size and the amount of bBALN you hold.
      </Typography>
    )}
  </>
);

const RewardsDisplay: React.FC<RewardsDisplayProps> = ({ pair }) => {
  const { data: prices } = useTokenPrices();

  if (!prices) return null;

  const externalApy = pair.externalRewardsTotalAPR || 0;

  const balnApy = (pair.balnApy || 0) * 100;
  const totalApy = balnApy + externalApy;

  if (totalApy <= 0) return null;

  return (
    <Wrapper>
      {pair.externalRewards?.map((reward, index) => (
        <APYItem key={index} ml="7px">
          <Typography color="#d5d7db" fontSize={14} marginRight={'5px'}>
            {reward.currency.symbol}:{' '}
          </Typography>
          {formatValue(getRewardApr(reward, pair, prices?.[reward.currency.symbol]?.toNumber() || 0).toFixed(), false)}%
        </APYItem>
      ))}
    </Wrapper>
  );
};

export default RewardsDisplay;
