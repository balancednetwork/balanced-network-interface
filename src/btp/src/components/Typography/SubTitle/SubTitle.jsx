import React from 'react';

import styled from 'styled-components/macro';

import { normal, sm, md, lg, bold } from './mixins';

const StyledSubTitle = styled.h4`
  ${normal};
  ${({ $color }) => $color && `color:${$color}`};

  &.sm {
    ${sm};
  }

  &.md {
    ${md};
  }

  &.lg {
    ${lg};
  }

  &.bold {
    ${bold};
  }
`;

export const SubTitle = ({ children, className, color }) => {
  return (
    <StyledSubTitle className={`subtitle-text ${className}`} $color={color}>
      {children}
    </StyledSubTitle>
  );
};
