import React from 'react';

import { useCollateralDataFor } from '@/queries/backendv2';

import MultiLineChart, { DEFAULT_HEIGHT } from '@/components/MultiLineChart';
import Spinner from '@/components/Spinner';

import { ChartContainer } from '..';
import { useTheme } from 'styled-components';

export default function Chart({
  collateralTVLHover,
  collateralLabel,
  selectedTimeFrame,
  setCollateralTVLHover,
  setCollateralLabel,
  setTotalStabilityFundBnUSD,
  setUserHovering,
}) {
  const theme = useTheme();
  const { data: collateralData } = useCollateralDataFor(selectedTimeFrame.days);

  React.useEffect(() => {
    setTotalStabilityFundBnUSD(collateralData?.current.fundTotal.value);
  }, [collateralData, setTotalStabilityFundBnUSD]);

  return (
    <>
      <ChartContainer
        onMouseEnter={() => setUserHovering(true)}
        onMouseLeave={() => setUserHovering(false)}
        onTouchStart={() => setUserHovering(true)}
        onTouchEnd={() => setUserHovering(false)}
      >
        {collateralData ? (
          <MultiLineChart
            data={collateralData.series.fundTotalStacked}
            height={DEFAULT_HEIGHT}
            minHeight={DEFAULT_HEIGHT}
            color={theme.colors.primary}
            value={collateralTVLHover}
            label={collateralLabel}
            setValue={setCollateralTVLHover}
            setLabel={setCollateralLabel}
          />
        ) : (
          <Spinner size={75} />
        )}
      </ChartContainer>
    </>
  );
}
