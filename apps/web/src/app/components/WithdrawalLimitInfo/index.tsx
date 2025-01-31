import { useOraclePrices } from '@/store/oracle/hooks';
import { useWithdrawalsFloorDEXData } from '@/store/swap/hooks';
import { formatBalance } from '@/utils/formatter';
import { t } from '@lingui/macro';
import React from 'react';
import { Grid, NetworkName as Label, Amount as Value } from '../AssetManagerTokenBreakdown';
import QuestionHelper, { QuestionWrapper } from '../QuestionHelper';

interface Props {
  symbol?: string;
  spacing?: { x: number; y: number };
}

const WithdrawalLimitInfo: React.FC<Props> = ({ symbol, spacing = { x: 0, y: 0 } }) => {
  const { data: withdrawalLimits } = useWithdrawalsFloorDEXData();
  const prices = useOraclePrices();

  if (!symbol || !withdrawalLimits) return null;

  const limitData = withdrawalLimits.find(limit => limit.token.symbol === symbol);
  if (!limitData) return null;

  const price = prices[symbol];

  return (
    <QuestionWrapper style={{ marginLeft: `${spacing.x}px`, transform: `translateY(${spacing.y}px)` }}>
      <QuestionHelper
        width={280}
        text={
          <Grid>
            <Label>{t`${limitData?.floorTimeDecayInHours.toFixed(0)}h withdrawal limit:`}</Label>
            <Value>{`${limitData?.percentageFloor.times(100).toFixed(2).replace('.00', '')}%`}</Value>
            <Label>{t`Available to trade:`}</Label>
            <Value>
              {formatBalance(limitData.available.toFixed(), price?.toFixed() || 1)} {symbol}
            </Value>
          </Grid>
        }
      ></QuestionHelper>
    </QuestionWrapper>
  );
};

export default WithdrawalLimitInfo;
