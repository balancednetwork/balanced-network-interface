import React from 'react';

import { BarChart, Bar, Tooltip, ResponsiveContainer } from 'recharts';
import styled, { useTheme } from 'styled-components';

import { xCallActivityDataType } from 'store/xCall/hooks';

const TooltipWrapper = styled.div`
  background: ${({ theme }) => theme.colors.bg4};
  border: 2px solid ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text};
  border-radius: 8px;
  padding: 10px;
  font-size: 14px;
  display: flex;
  justify-content: center;
  flex-direction: column;
  transform: translateX(calc(-50% - 11px));
  position: relative;

  strong,
  span {
    color: ${({ theme }) => theme.colors.text};
  }

  label {
    color: ${({ theme }) => theme.colors.text2};
  }

  &:before {
    content: '';
    position: absolute;
    width: 0;
    height: 0;
    border-left: 9px solid transparent;
    border-right: 9px solid transparent;
    border-bottom: 9px solid ${({ theme }) => theme.colors.primary};
    top: -9px;
    left: 50%;
    transform: translateX(-50%);
  }
`;

function getLabel(hour: number) {
  const start = hour.toString().padStart(2, '0');
  const end = (parseInt(hour.toString()) + 1).toString().padStart(2, '0');
  return `${start}:00 - ${end}:00`;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const { count, hour } = payload[0].payload;
    return (
      <TooltipWrapper>
        <span>
          <strong>{count - 1}</strong> transaction{count === 2 ? '' : 's'}
        </span>
        <label>{getLabel(hour)}</label>
      </TooltipWrapper>
    );
  }

  return null;
};

const ActivityBarChart = ({ data }: { data: xCallActivityDataType[] }) => {
  const theme = useTheme();

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <Bar dataKey="count" fill={theme.colors.primary} radius={[3, 3, 3, 3]} />
        <Tooltip
          cursor={false}
          // @ts-ignore
          content={<CustomTooltip />}
          position={{ y: 60 }}
          allowEscapeViewBox={{ x: true, y: true }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ActivityBarChart;
