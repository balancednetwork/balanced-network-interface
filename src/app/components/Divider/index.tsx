import React from 'react';

import { Box } from 'rebass/styled-components';
import styled from 'styled-components';

const Divider = styled(Box)`
  height: 1px;
  background-color: ${({ theme }) => theme.colors.divider};
`;

export default Divider;

const StyledHr = styled.div`
  width: 1px;
  height: 100%;
  background-color: ${({ theme }) => theme.colors.divider};
`;

const StyledWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  span {
    white-space: nowrap;
  }
`;

export const VerticalDivider = ({ text, ...rest }: { text: string }) => {
  return (
    <StyledWrapper>
      <StyledHr />
      <span>{text}</span>
      <StyledHr />
    </StyledWrapper>
  );
};
