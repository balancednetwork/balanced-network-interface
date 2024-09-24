import { Box, Flex } from 'rebass/styled-components';
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
`;

export const BoxPanel = styled(Box)<{
  padding?: string;
  border?: string;
  borderRadius?: string;
}>`
  border-radius: 15px;
  padding: 15px;
  padding: ${({ padding }) => padding};
  border-radius: ${({ borderRadius }) => borderRadius};
`;

export const BoxPanelWrap = styled.div``;

export const Panel = styled(Flex)`
  overflow: hidden;
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
  border-bottom-left-radius: 10px;
`;

export const SectionPanel = styled(Panel)`
  flex-direction: column;
`;

export const BrightPanel = styled(Panel)`
  max-width: initial;
`;
