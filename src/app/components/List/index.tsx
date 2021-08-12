import { Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Typography } from 'app/theme';

export const DashGrid = styled(Box)`
  display: grid;
  grid-template-columns: 1fr 1fr;
`;

export const HeaderText = styled(Typography)`
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 3px;
`;

export const DataText = styled(Typography)`
  color: inherit;
  font-size: 16px;
`;

export const ListItem = styled(DashGrid)`
  padding: 20px 0;
  cursor: pointer;
  color: #ffffff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);

  :hover {
    color: #2ca9b7;
    transition: color 0.2s ease;
  }
`;

export const List = styled(Box)`
  max-height: 300px;
  overflow: auto;
  width: 316px;
  padding: 25px;
  -webkit-overflow-scrolling: touch;

  & > ${ListItem}:last-child {
    padding-bottom: 0;
    border-bottom: none;
  }
`;
