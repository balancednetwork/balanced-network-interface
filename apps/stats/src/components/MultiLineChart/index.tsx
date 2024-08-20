import React, { Dispatch, SetStateAction, ReactNode } from 'react';

import { ContractMethodsDataType } from '@/queries/backendv2';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { Box, Flex } from 'rebass';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import styled, { css, useTheme } from 'styled-components';

import Card from '@/components/Card';
import { RowBetween } from '@/components/Row';
import { TooltipContainer } from '@/components/Tooltip';
import { Typography } from '@/theme';
import { formatYAxisNumber, getFormattedNumber } from '@/utils/formatter';

dayjs.extend(utc);

export const DEFAULT_HEIGHT = 260;

const Wrapper = styled(Card)`
  width: 100%;
  height: ${DEFAULT_HEIGHT}px;
  padding: 0;
  display: flex;
  background-color: transparent;
  flex-direction: column;
  > * {
    font-size: 1rem;
  }
`;

export type LineChartProps = {
  data: ContractMethodsDataType[];
  color?: string | undefined;
  height?: number | undefined;
  minHeight?: number;
  setValue?: Dispatch<SetStateAction<number | undefined>>; // used for value on hover
  setLabel?: Dispatch<SetStateAction<string | undefined>>; // used for label of valye
  value?: number;
  label?: string;
  topLeft?: ReactNode | undefined;
  topRight?: ReactNode | undefined;
  bottomLeft?: ReactNode | undefined;
  bottomRight?: ReactNode | undefined;
} & React.HTMLAttributes<HTMLDivElement>;

export const StyledTooltipContainer = styled(TooltipContainer)`
  ${({ theme }) => css`
    border: 2px solid ${theme.colors.primaryBright};
    border-radius: 10px;
    background: ${theme.colors.bg4};
  `};
`;

const Dot = styled(Box)<{ color: string }>`
  width: 5px;
  height: 14px;
  border-radius: 5px;
  position: relative;
  margin-right: 15px;
  transform: translate3d(-6px, 4px, 0);
  ${({ color }) => `background: ${color}`};
`;

const Chart = ({
  data,
  color = '#56B2A4',
  value,
  label,
  setValue,
  setLabel,
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
  minHeight = DEFAULT_HEIGHT,
  isPredefined,
  ...rest
}: LineChartProps | any) => {
  const theme = useTheme();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload) {
      const formattedTime = dayjs(label).format('MMM D, YYYY');
      if (setLabel) {
        setLabel(formattedTime);
      }

      if (setValue) {
        setValue(
          Math.round(payload[0].payload.IUSDC || 0) +
            Math.round(payload[0].payload.USDS || 0) +
            Math.round(payload[0].payload.BUSD || 0),
        );
      }

      return payload[0].payload.IUSDC ? (
        <StyledTooltipContainer>
          <Flex>
            <Dot color="#2875ca"></Dot>
            {`${getFormattedNumber(payload[0].payload.IUSDC, 'number')}`}
            <Typography opacity={0.75} ml="5px">
              IUSDC
            </Typography>
          </Flex>
          {payload[0].payload.USDS ? (
            <Flex mt="2px">
              <Dot color="#ab00ff"></Dot>
              {`${getFormattedNumber(payload[0].payload.USDS, 'number')}`}
              <Typography opacity={0.75} ml="5px">
                USDS
              </Typography>
            </Flex>
          ) : null}
          {payload[0].payload.BUSD ? (
            <Flex mt="2px">
              <Dot color="#f0b90c"></Dot>
              {`${getFormattedNumber(payload[0].payload.BUSD, 'number')}`}
              <Typography opacity={0.75} ml="5px">
                BUSD
              </Typography>
            </Flex>
          ) : null}
        </StyledTooltipContainer>
      ) : null;
    }

    return null;
  };

  return (
    <Wrapper minHeight={minHeight} {...rest}>
      <RowBetween>
        {topLeft ?? null}
        {topRight ?? null}
      </RowBetween>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          width={500}
          height={260}
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
          onMouseLeave={() => {
            setLabel && setLabel(undefined);
            setValue && setValue(undefined);
          }}
        >
          <defs>
            <linearGradient id="gradientIUSDC" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2875ca" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#2875ca" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradientUSDS" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ab00ff" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#ab00ff" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradientBUSD" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f0b90c" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#f0b90c" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="timestamp"
            axisLine={false}
            tickLine={false}
            minTickGap={10}
            tick={{ stroke: theme.colors.text1, fontSize: '14px' }}
            tickFormatter={time => dayjs(time).format('DD/MM')}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            orientation="right"
            tick={{ stroke: theme.colors.text1, fontSize: '14px' }}
            tickFormatter={value => formatYAxisNumber(value, value > 100 ? 1 : 2)}
            width={20}
            padding={{ top: 10, bottom: 25 }}
          />

          <Tooltip
            cursor={{ stroke: theme.colors.text1 }}
            // contentStyle={{ display: 'none' }}
            content={<CustomTooltip active={!!label} payload={value} label={label} />}
            // @ts-ignore
            formatter={(
              value: number,
              name: string,
              props: { payload: { timestamp: number; BUSD: number; IUSDC: number; USDS: number } },
            ) => {
              if (setValue) {
                setValue(props.payload);
              }
              const formattedTime = dayjs(props.payload.timestamp).format('MMM D, YYYY');
              if (setLabel && label !== formattedTime) setLabel(formattedTime);
            }}
          />
          <Area dataKey="IUSDC" type="monotone" stroke={'#2875ca'} fill="url(#gradientIUSDC)" strokeWidth={2} />
          <Area dataKey="USDS" type="monotone" stroke={'#ab00ff'} fill="url(#gradientUSDS)" strokeWidth={2} />
          <Area dataKey="BUSD" type="monotone" stroke={'#f0b90c'} fill="url(#gradientBUSD)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
      <RowBetween>
        {bottomLeft ?? null}
        {bottomRight ?? null}
      </RowBetween>
    </Wrapper>
  );
};

export default Chart;
