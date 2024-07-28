import { Box, Flex } from 'rebass';
import styled from 'styled-components';

export const SelectorWrap = styled(Box)`
  padding: 25px 25px 10px 25px;
  width: 99vw;
  max-width: 415px;
`;

export const ChainItemWrap = styled(Flex)`
  transition: color 0.3s ease;
  align-items: center;
  padding: 10px 0;
`;

export const Grid = styled(Box)<{ $isSignedIn?: boolean }>`
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100%;
  align-items: center;
  padding: 8px 0;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text};

  &:hover {
  color: ${({ theme }) => theme.colors.primaryBright};
  }

  *:last-child {
    text-align: right;
  }
`;

export const ScrollHelper = styled(Box)`
  max-height: 250px; 
  overflow: auto; 
  padding: 0 20px;
  margin: 0 -20px !important;
`;
