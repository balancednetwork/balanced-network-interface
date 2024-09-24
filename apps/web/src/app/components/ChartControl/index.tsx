import { Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button } from '@/app/components/Button';
import { HEIGHT } from '@/app/components/TradingViewChart';

export const ChartContainer = styled(Box)`
  position: relative;
  height: ${HEIGHT}px;
`;

export const ChartControlGroup = styled(Box)`
  text-align: left;

  & button {
    margin-right: 5px;
  }

  & button:last-child {
    margin-right: 0;
  }
`;

export const ChartControlButton = styled(Button)<{ $active?: boolean }>`
  padding: 1px 12px;
  border-radius: 100px;
  color: #ffffff;
  font-size: 14px;
  background-color: ${({ theme, $active }) => ($active ? theme.colors?.primary : theme.colors?.bg3)};
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors?.primary};
  }
`;
