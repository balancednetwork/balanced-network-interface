import React, { useState, useEffect, useRef } from 'react';

import { createChart, IChartApi, ChartOptions, DeepPartial } from 'lightweight-charts';
import styled from 'styled-components';

export const CHART_PERIODS = {
  '5m': '5m',
  '15m': '15m',
  '1H': '1H',
  '4H': '4H',
  '1D': '1D',
};

export const CHART_TYPES = {
  AREA: 'Line',
  // CANDLE: 'Candles',
};

const Wrapper = styled.div`
  position: relative;
`;

// constant height for charts
export const HEIGHT = 260;

const AreaOption: DeepPartial<ChartOptions> = {
  height: HEIGHT,
  layout: {
    backgroundColor: '#0c2a4d',
    textColor: '#d1d4dc',
  },
  grid: {
    vertLines: {
      visible: false,
    },
    horzLines: {
      visible: false,
    },
  },
  rightPriceScale: {
    borderColor: '#304a68',
  },
  timeScale: {
    borderColor: '#304a68',
  },
  crosshair: {
    horzLine: {
      visible: false,
    },
  },
  localization: {
    dateFormat: 'yyyy-MM-dd',
  },
};

// const CandleOption: DeepPartial<ChartOptions> = {
//   height: HEIGHT,
//   layout: {
//     backgroundColor: '#0c2a4d',
//     textColor: 'rgba(255, 255, 255, 0.9)',
//   },
//   grid: {
//     vertLines: {
//       color: '#304a68',
//       visible: false,
//     },
//     horzLines: {
//       color: '#304a68',
//       visible: false,
//     },
//   },
//   rightPriceScale: {
//     borderColor: '#304a68',
//   },
//   timeScale: {
//     borderColor: '#304a68',
//   },
//   crosshair: {
//     mode: CrosshairMode.Normal,
//   },
// };

const TradingViewChart = ({ type = CHART_TYPES.AREA, data, candleData, width }) => {
  // reference for DOM element to create with chart
  const ref = useRef<HTMLDivElement>(null);

  // pointer to the chart object
  const [chartCreated, setChartCreated] = useState<IChartApi | null>(null);

  // adjust the scale based on the type of chart
  const topScale = type === CHART_TYPES.AREA ? 0.32 : 0.2;

  // if no chart created yet, create one with options and add to DOM manually
  useEffect(() => {
    if (!chartCreated && data && ref.current) {
      let chart = createChart(ref.current, { width: width, ...AreaOption });

      let series = chart.addAreaSeries({
        topColor: 'rgba(44, 169, 183, 0.56)',
        bottomColor: 'rgba(44, 169, 183, 0.04)',
        lineColor: 'rgba(44, 169, 183, 1)',
        lineWidth: 2,
      });
      console.log(data);
      series.setData(data);

      chart.applyOptions({
        timeScale: {
          timeVisible: true,
        },
      });

      chart.timeScale().fitContent();

      setChartCreated(chart);
    }
  }, [chartCreated, data, candleData, topScale, type, width]);

  // responsiveness
  useEffect(() => {
    if (width) {
      chartCreated && chartCreated.resize(width, HEIGHT);
      chartCreated && chartCreated.timeScale().scrollToPosition(0, true);
    }
  }, [chartCreated, width]);

  return (
    <Wrapper>
      <div ref={ref} id={'test-id' + type} />
    </Wrapper>
  );
};

export default TradingViewChart;
