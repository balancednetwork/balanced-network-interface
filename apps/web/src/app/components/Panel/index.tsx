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
  border-radius: 15px;
  padding: 15px;
  padding: ${({ padding }) => padding};
  border-radius: ${({ borderRadius }) => borderRadius};

  ${({ theme }) => theme.mediaWidth.up500`
    padding: 20px;
  `};

  ${({ theme }) => theme.mediaWidth.upExtraSmall`
    padding: 35px 35px 30px 35px;
  `}
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
  ${({ theme }) => theme.mediaWidth.upSmall`
    flex-direction: row;
  `}
`;

export const BrightPanel = styled(Panel)`
  max-width: initial;

  ${({ theme }) => theme.mediaWidth.upSmall`
    max-width: 360px;
  `}
`;
