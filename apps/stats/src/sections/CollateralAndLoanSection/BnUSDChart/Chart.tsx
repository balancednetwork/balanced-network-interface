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
  setBnUSDChange,
  setUserHovering,
}) {
  const { data: debtData } = useDebtDataFor(timeFrames[selectedTimeFrame].days);

  const data = useMemo(() => {
    return debtData?.[selectedCollateral];
  }, [debtData, selectedCollateral]);

  useEffect(() => {
    if (data && data[data.length - 1]) {
      const valueNow = data[data.length - 1].value;
      const valuePrev = data[data.length - 30].value;

      setTotalBnUSD(valueNow);
      setBnUSDChange(valueNow - valuePrev);
    }
  }, [data, setTotalBnUSD, setBnUSDChange]);

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
