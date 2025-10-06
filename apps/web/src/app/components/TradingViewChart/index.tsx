import React, { useState, useEffect, useRef, useCallback } from 'react';

import BigNumber from 'bignumber.js';
import dayjs from 'dayjs';
import {
  BusinessDay,
  ChartOptions,
  CrosshairMode,
  DeepPartial,
  IChartApi,
  UTCTimestamp,
  createChart,
  isBusinessDay,
} from 'lightweight-charts';
import { usePrevious } from 'react-use';
import styled from 'styled-components';
import { formatPrice } from '../../../utils/formatter';

export enum CHART_PERIODS {
  '15m' = '15m',
  '1H' = '1H',
  '4H' = '4H',
  '1D' = '1D',
  '1W' = '1W',
}

export enum CHART_TYPES {
  AREA = 'Line',
  CANDLE = 'Candles',
}

const Wrapper = styled.div`
  position: relative;
  touch-action: pan-x; /* Allow horizontal panning for chart scrolling */
  -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
`;

// constant height for charts
export const HEIGHT = 320;

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
    rightOffset: 0,
    barSpacing: 6,
    lockVisibleTimeRangeOnResize: true,
    rightBarStaysOnScroll: true,
    timeVisible: true,
    secondsVisible: false,
  },
  handleScroll: {
    mouseWheel: false,
    pressedMouseMove: false,
    horzTouchDrag: true, // Enable horizontal touch drag for crosshair and scrolling
    vertTouchDrag: false,
  },
  handleScale: {
    axisPressedMouseMove: false,
    mouseWheel: false,
    pinch: false,
  },
  crosshair: {
    mode: CrosshairMode.Normal,
    vertLine: {
      color: '#758696',
      width: 1,
      style: 0, // Solid line
      labelBackgroundColor: '#758696',
      visible: false, // Hide by default, show only on touch
    },
    horzLine: {
      color: '#758696',
      width: 1,
      style: 0, // Solid line
      labelBackgroundColor: '#758696',
      visible: false, // Hide by default, show only on touch
    },
  },
  localization: {
    timeFormatter: (time: BusinessDay | UTCTimestamp) => {
      if (isBusinessDay(time)) {
        return '';
      }

      return dayjs(time * 1000).format('DD MMM YY hh:mma');
    },
    priceFormatter: price => formatPrice(price),
  },
};

const CandleOption: DeepPartial<ChartOptions> = {
  height: HEIGHT,
  layout: {
    backgroundColor: '#0c2a4d',
    textColor: 'rgba(255, 255, 255, 0.9)',
  },
  grid: {
    vertLines: {
      color: '#304a68',
      visible: false,
    },
    horzLines: {
      color: '#304a68',
      visible: false,
    },
  },
  rightPriceScale: {
    borderColor: '#304a68',
  },
  timeScale: {
    borderColor: '#304a68',
    rightOffset: 0,
    barSpacing: 6,
    lockVisibleTimeRangeOnResize: true,
    rightBarStaysOnScroll: true,
    timeVisible: true,
    secondsVisible: false,
  },
  handleScroll: {
    mouseWheel: false,
    pressedMouseMove: false,
    horzTouchDrag: true, // Enable horizontal touch drag for crosshair and scrolling
    vertTouchDrag: false,
  },
  handleScale: {
    axisPressedMouseMove: false,
    mouseWheel: false,
    pinch: false,
  },
  crosshair: {
    mode: CrosshairMode.Normal,
    vertLine: {
      color: '#758696',
      width: 1,
      style: 0, // Solid line
      labelBackgroundColor: '#758696',
      visible: false, // Hide by default, show only on touch
    },
    horzLine: {
      color: '#758696',
      width: 1,
      style: 0, // Solid line
      labelBackgroundColor: '#758696',
      visible: false, // Hide by default, show only on touch
    },
  },
  localization: {
    timeFormatter: (time: BusinessDay | UTCTimestamp) => {
      if (isBusinessDay(time)) {
        return '';
      }

      return dayjs(time * 1000).format('DD MMM YY hh:mm a');
    },
    priceFormatter: price => formatPrice(price),
  },
};

const TradingViewChart = ({ type = CHART_TYPES.AREA, data, volumeData, width }) => {
  // reference for DOM element to create with chart
  const ref = useRef<HTMLDivElement>(null);

  // pointer to the chart object
  const [chartCreated, setChartCreated] = useState<IChartApi | null>(null);

  const dataPrev = usePrevious(data);

  // Track the last formatted price to detect crosshair vs regular ticks
  const lastFormattedPrice = useRef<string>('');
  const isCrosshairPrice = useRef<boolean>(false);

  // Touch interaction state
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const isTouchDragging = useRef<boolean>(false);

  // Custom price formatter that detects crosshair vs regular ticks
  const priceFormatter = useCallback((price: number) => {
    const formatted = formatPrice(price);

    // If this is the same price as last time, it's likely a crosshair update
    if (lastFormattedPrice.current === formatted) {
      isCrosshairPrice.current = true;
      return formatted; // Don't pad crosshair prices
    }

    // Different price, likely a regular tick
    lastFormattedPrice.current = formatted;
    isCrosshairPrice.current = false;
    return formatted.padEnd(10, ' '); // Pad regular ticks
  }, []);

  // Touch event handlers for enhanced crosshair interaction
  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 1 && chartCreated) {
        const touch = e.touches[0];
        touchStartX.current = touch.clientX;
        touchStartY.current = touch.clientY;
        isTouchDragging.current = false;

        // Show crosshair on touch start
        chartCreated.applyOptions({
          crosshair: {
            vertLine: {
              visible: true,
            },
            horzLine: {
              visible: true,
            },
          },
        });
      }
    },
    [chartCreated],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 1 && chartCreated) {
        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - touchStartX.current);
        const deltaY = Math.abs(touch.clientY - touchStartY.current);

        // If horizontal movement is greater than vertical, enable crosshair dragging
        if (deltaX > deltaY && deltaX > 10) {
          isTouchDragging.current = true;
          // Prevent default scrolling behavior
          e.preventDefault();
        }
      }
    },
    [chartCreated],
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (chartCreated) {
        isTouchDragging.current = false;

        // Hide crosshair after touch ends with a small delay
        setTimeout(() => {
          chartCreated.applyOptions({
            crosshair: {
              vertLine: {
                visible: false,
              },
              horzLine: {
                visible: false,
              },
            },
          });
        }, 200); // Delay to allow user to see the final crosshair position
      }
    },
    [chartCreated],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  React.useEffect(() => {
    if (data !== dataPrev && chartCreated) {
      // remove the tooltip element
      chartCreated.resize(0, 0);
      chartCreated.remove();
      setChartCreated(null);
    }
  }, [chartCreated, data, dataPrev, type]);

  // adjust the scale based on the type of chart
  // const topScale = type === CHART_TYPES.AREA ? 0.32 : 0.2;

  // if no chart created yet, create one with options and add to DOM manually
  useEffect(() => {
    if (data && ref.current) {
      const chartOptions =
        type === CHART_TYPES.CANDLE ? { width: width, ...CandleOption } : { width: width, ...AreaOption };

      // Override the priceFormatter with our custom one
      chartOptions.localization = {
        ...chartOptions.localization,
        priceFormatter: priceFormatter,
      };

      const chart = createChart(ref.current, chartOptions);

      if (type === CHART_TYPES.CANDLE) {
        const candleSeries = chart.addCandlestickSeries({
          upColor: 'rgba(44, 169, 183, 1)',
          downColor: '#fb6a6a',
          borderDownColor: '#fb6a6a',
          borderUpColor: 'rgba(44, 169, 183, 1)',
          wickDownColor: '#fb6a6a',
          wickUpColor: 'rgba(44, 169, 183, 1)',
          priceLineVisible: false,
          lastValueVisible: true,
        });

        candleSeries.setData(data);

        const volumeSeries = chart.addHistogramSeries({
          color: 'rgba(44, 169, 183, 0.5)',
          priceFormat: {
            type: 'volume',
          },
          priceLineVisible: false,
          priceScaleId: '',
          scaleMargins: {
            top: 0.85,
            bottom: 0,
          },
        });

        volumeSeries.setData(volumeData);
      } else {
        const series = chart.addAreaSeries({
          topColor: 'rgba(44, 169, 183, 0.56)',
          bottomColor: 'rgba(44, 169, 183, 0.04)',
          lineColor: 'rgba(44, 169, 183, 1)',
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: true,
        });
        series.setData(data);
      }

      chart.timeScale().fitContent();

      // Add touch event listeners for enhanced crosshair interaction
      const chartContainer = ref.current;
      if (chartContainer) {
        chartContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
        chartContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
        chartContainer.addEventListener('touchend', handleTouchEnd, { passive: true });

        // Disable mouse hover crosshair by preventing mouse events
        const handleMouseMove = () => {
          chart.applyOptions({
            crosshair: {
              vertLine: {
                visible: false,
              },
              horzLine: {
                visible: false,
              },
            },
          });
        };

        chartContainer.addEventListener('mousemove', handleMouseMove);
        chartContainer.addEventListener('mouseenter', handleMouseMove);
      }

      setChartCreated(chart);

      return () => {
        // Remove touch event listeners
        if (chartContainer) {
          chartContainer.removeEventListener('touchstart', handleTouchStart);
          chartContainer.removeEventListener('touchmove', handleTouchMove);
          chartContainer.removeEventListener('touchend', handleTouchEnd);

          // Remove mouse event listeners
          const handleMouseMove = () => {
            chart.applyOptions({
              crosshair: {
                vertLine: {
                  visible: false,
                },
                horzLine: {
                  visible: false,
                },
              },
            });
          };
          chartContainer.removeEventListener('mousemove', handleMouseMove);
          chartContainer.removeEventListener('mouseenter', handleMouseMove);
        }

        // destroy chart
        chart.resize(0, 0);
        chart.remove();
        setChartCreated(null);
      };
    }
  }, [data, type, width, volumeData, priceFormatter, handleTouchStart, handleTouchMove, handleTouchEnd]);

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
