import styled from 'styled-components';

import { BoxPanel } from '@/app/components/Panel';

export const StyledBoxPanel = styled(BoxPanel)`
  display: flex;
  margin-bottom: 20px;
  flex-direction: column;
  ${({ theme }) => theme.mediaWidth.upSmall`
     flex-direction: row;
  `}
`;
