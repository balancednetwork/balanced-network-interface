import { Box, Flex } from 'rebass/styled-components';
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

export const DataText = styled(Typography)<{ small?: boolean }>`
  color: inherit;
  font-size: ${props => (props.small ? '14px' : '16px')};
`;

export const ListItem = styled(DashGrid)<{ small?: boolean }>`
  ${props => props.small && 'grid-template-columns: 1fr;'}
  padding: ${props => (props.small ? '10px' : '20px')} 0;
  cursor: pointer;
  color: #ffffff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);

  :hover,
  &.focused {
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

export const List1 = styled(Box)`
  max-height: 260px;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0px 10px 0px 10px;

  & > ${ListItem}:last-child {
    padding-bottom: 0;
    border-bottom: none;
  }
`;

export const Option = styled(Box)`
  background-color: #144a68;
  border-radius: 12px;
  padding: 1px 12px;
  cursor: pointer;
  margin-right: 5px;
  font-size: 12px;
  &:hover {
    background-color: #2ca9b7;
    transition: background-color 0.2s ease;
  }
`;

export const HorizontalList = styled(Flex)`
  width: 230px;
  padding: 10px 0;
  & > ${Option}:last-child {
    margin-right: 0;
  }
`;
