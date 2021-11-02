import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

export const FlexPanel = styled(Flex)<{
  padding?: string;
  border?: string;
  borderRadius?: string;
}>`
  border-radius: 10px;
  padding: 25px;
  padding: ${({ padding }) => padding};
  border-radius: ${({ borderRadius }) => borderRadius};

  ${({ theme }) => theme.mediaWidth.upExtraSmall`
    padding: 35px;
  `}
`;

export const BoxPanel = styled(Box)<{
  padding?: string;
  border?: string;
  borderRadius?: string;
}>`
  border-radius: 10px;
  padding: 25px;
  padding: ${({ padding }) => padding};
  border-radius: ${({ borderRadius }) => borderRadius};

  ${({ theme }) => theme.mediaWidth.upExtraSmall`
    padding: 35px;
  `}
`;

export const BoxPanelWrap = styled.div``;
