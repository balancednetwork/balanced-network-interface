import React from 'react';

import styled from 'styled-components/macro';

import { normal, sm, xs, md, lg, bold } from './mixins';

export const StyledText = styled.p`
  ${normal};

  & {
    ${({ $color }) => $color && `color:${$color}`};
  }

  &.xs {
    ${xs};
  }

  &.sm {
    ${sm};
  }

  &.md {
    ${md};
  }

  &.lg {
    ${lg}
  }

  &.bold {
    ${bold}
  }

  &.center {
    text-align: center;
  }
`;

export const Text = ({ children, className, color }) => {
  return (
    <StyledText className={`plain-text ${className}`} $color={color}>
      {children}
    </StyledText>
  );
};
