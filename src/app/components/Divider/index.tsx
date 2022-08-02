import React from 'react';

import { Box } from 'rebass/styled-components';
import styled, { css } from 'styled-components';

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

const StyledWrapper = styled.div<{ horizontal?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;

  span {
    white-space: nowrap;
  }

  ${({ horizontal }) =>
    horizontal &&
    css`
      flex-direction: row;

      span {
        display: inline-block;
        text-transform: uppercase;
        letter-spacing: 3px;
        padding: 0 10px;
      }

      ${StyledHr} {
        width: 100%;
        height: 1px;
      }
    `};
`;

export const HorizontalDivider = ({ text, ...rest }: { text: string }) => {
  return (
    <StyledWrapper horizontal>
      <StyledHr />
      <span>{text}</span>
      <StyledHr />
    </StyledWrapper>
  );
};

export const VerticalDivider = ({ text, ...rest }: { text: string }) => {
  return (
    <StyledWrapper>
      <StyledHr />
      <span>{text}</span>
      <StyledHr />
    </StyledWrapper>
  );
};

export const LineBreak = () => (
  <>
    <br />
    <br />
  </>
);
