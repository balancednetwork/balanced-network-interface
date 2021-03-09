import { Flex } from 'rebass/styled-components';
import styled from 'styled-components';

export const Panel = styled(Flex)`
  overflow: hidden;
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
  border-bottom-left-radius: 10px;
`;

export const SectionPanel = styled(Panel)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
  `}
`;

export const BrightPanel = styled(Panel)`
  max-width: 360px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    max-width: initial;
  `}
`;
