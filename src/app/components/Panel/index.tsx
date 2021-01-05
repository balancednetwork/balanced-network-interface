import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

export const FlexPanel = styled(Flex)<{
  padding?: string;
  border?: string;
  borderRadius?: string;
}>`
  border-radius: 10px;
  padding: 32px;
  padding: ${({ padding }) => padding};
  border-radius: ${({ borderRadius }) => borderRadius};
`;

export const BoxPanel = styled(Box)<{
  padding?: string;
  border?: string;
  borderRadius?: string;
}>`
  border-radius: 10px;
  padding: 32px;
  padding: ${({ padding }) => padding};
  border-radius: ${({ borderRadius }) => borderRadius};
`;
