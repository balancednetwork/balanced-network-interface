import React, { useEffect, useMemo } from 'react';

import { useCollateralDataFor } from '@/queries/backendv2';

import { predefinedCollateralTypes } from '@/components/CollateralSelector/CollateralTypeList';
import LineChart, { DEFAULT_HEIGHT } from '@/components/LineChart';
import Spinner from '@/components/Spinner';

import { useTheme } from 'styled-components';
import { ChartContainer } from '..';
import { timeFrames } from '../TimeFrameSelector';

export default function Chart({
  selectedCollateral,
  collateralTVLHover,
  collateralLabel,
  selectedTimeFrame,
  setCollateralTVLHover,
  setCollateralLabel,
  setUserHovering,
  setCollateralChange,
  setTotalCollateral,
}) {
  const theme = useTheme();
  const { data: collateralData } = useCollateralDataFor(timeFrames[selectedTimeFrame].days);

  const seriesData = useMemo(() => {
    if (selectedCollateral === predefinedCollateralTypes.ALL) {
      return collateralData?.series.total;
    } else if (selectedCollateral === predefinedCollateralTypes.STABILITY_FUND) {
      return collateralData?.series.fundTotal;
    } else {
      return collateralData?.series[selectedCollateral];
    }
  }, [collateralData, selectedCollateral]);

  useEffect(() => {
    if (seriesData) {
      const valueNow = seriesData[seriesData.length - 1].value;
      const valuePrev = seriesData[seriesData.length - 30].value;

      setCollateralChange(valueNow - valuePrev);
      setTotalCollateral(valueNow);
    }
  }, [seriesData, setCollateralChange, setTotalCollateral]);

  return (
    <>
      <ChartContainer
        onMouseEnter={() => setUserHovering(true)}
        onMouseLeave={() => setUserHovering(false)}
        onTouchStart={() => setUserHovering(true)}
        onTouchEnd={() => setUserHovering(false)}
      >
        {seriesData ? (
          <LineChart
            data={seriesData}
            height={DEFAULT_HEIGHT}
            minHeight={DEFAULT_HEIGHT}
            color={theme.colors.primary}
            value={collateralTVLHover}
            label={collateralLabel}
            setValue={setCollateralTVLHover}
            setLabel={setCollateralLabel}
            customId={'collateralChart'}
          />
        ) : (
          <Spinner size={75} />
        )}
      </ChartContainer>
    </>
  );
}
