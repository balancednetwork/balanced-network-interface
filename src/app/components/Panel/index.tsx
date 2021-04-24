import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

export const FlexPanel = styled(Flex)<{
  padding?: string;
  border?: string;
  borderRadius?: string;
}>`
  border-radius: 10px;
  padding: 35px;
  padding: ${({ padding }) => padding};
  border-radius: ${({ borderRadius }) => borderRadius};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    padding: 25px;
  `}
`;

export const BoxPanel = styled(Box)<{
  padding?: string;
  border?: string;
  borderRadius?: string;
}>`
  border-radius: 10px;
  padding: 35px;
  padding: ${({ padding }) => padding};
  border-radius: ${({ borderRadius }) => borderRadius};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    padding: 25px;
  `}
`;
