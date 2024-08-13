import React, { Dispatch, SetStateAction, ReactNode } from 'react';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { ContractMethodsDataType } from '@/queries/backendv2';
import { ResponsiveContainer, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts';
import styled, { useTheme } from 'styled-components';

import Card from '@/components/Card';
import { RowBetween } from '@/components/Row';
import { formatYAxisNumber } from '@/utils/formatter';

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
  customId?: string;
} & React.HTMLAttributes<HTMLDivElement>;

const Chart = ({
  data,
  color = '#2ca9b7',
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
  customId,
  ...rest
}: LineChartProps | any) => {
  const theme = useTheme();
  const parsedValue = value;

  const YAxisOffset = React.useMemo(() => {
    const offset = 1;
    const minValue = Math.min(...data.map(d => d.value));
    return minValue * (1 - offset);
  }, [data]);

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
            right: 35,
            left: 20,
            bottom: 5,
          }}
          onMouseLeave={() => {
            setLabel && setLabel(undefined);
            setValue && setValue(undefined);
          }}
        >
          <defs>
            <linearGradient id={`gradient${customId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.5} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
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
            dataKey="value"
            axisLine={false}
            tickLine={false}
            orientation="right"
            tick={{ stroke: theme.colors.text1, fontSize: '14px' }}
            tickFormatter={value => formatYAxisNumber(value, value > 100 ? 1 : 2)}
            width={20}
            domain={[`dataMin - ${YAxisOffset}`, 'auto']}
            padding={{ top: 10, bottom: 25 }}
          />

          <Tooltip
            cursor={{ stroke: theme.colors.text1 }}
            contentStyle={{ display: 'none' }}
            // @ts-ignore
            formatter={(value: number, name: string, props: { payload: { timestamp: number; value: number } }) => {
              if (setValue && parsedValue !== props.payload.value) {
                setValue(props.payload.value);
              }
              const formattedTime = dayjs(props.payload.timestamp).format('MMM D, YYYY');
              if (setLabel && label !== formattedTime) setLabel(formattedTime);
            }}
          />
          <Area dataKey="value" type="monotone" stroke={color} fill={`url(#gradient${customId})`} strokeWidth={2} />
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
