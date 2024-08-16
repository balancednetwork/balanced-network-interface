import React, { useEffect, useMemo } from 'react';

import { useDebtDataFor } from '@/queries/backendv2';

import LineChart, { DEFAULT_HEIGHT } from '@/components/LineChart';
import Spinner from '@/components/Spinner';

import { ChartContainer } from '..';
import { timeFrames } from '../TimeFrameSelector';

const MemoizedLineChart = React.memo(LineChart);

export default function Chart({
  collateralTVLHover,
  collateralLabel,
  selectedTimeFrame,
  selectedCollateral,
  setCollateralTVLHover,
  setCollateralLabel,
  setTotalBnUSD,
  setUserHovering,
}) {
  const { data: debtData } = useDebtDataFor(timeFrames[selectedTimeFrame].days);

  const data = useMemo(() => {
    return debtData?.[selectedCollateral];
  }, [debtData, selectedCollateral]);

  useEffect(() => {
    if (data && data[data.length - 1]) {
      setTotalBnUSD(data[data.length - 1].value);
    }
  }, [data, setTotalBnUSD]);

  return (
    <>
      <ChartContainer
        onMouseEnter={() => setUserHovering(true)}
        onMouseLeave={() => setUserHovering(false)}
        onTouchStart={() => setUserHovering(true)}
        onTouchEnd={() => setUserHovering(false)}
      >
        {data ? (
          <MemoizedLineChart
            data={data}
            height={DEFAULT_HEIGHT}
            minHeight={DEFAULT_HEIGHT}
            value={collateralTVLHover}
            label={collateralLabel}
            setValue={setCollateralTVLHover}
            setLabel={setCollateralLabel}
            customId={'bnUSDChart'}
          />
        ) : (
          <Spinner size={75} />
        )}
      </ChartContainer>
    </>
  );
}
