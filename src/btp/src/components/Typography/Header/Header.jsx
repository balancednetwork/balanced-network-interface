import React from 'react';

import { media } from 'btp/src/components/Styles/Media';
import styled from 'styled-components/macro';

import { normal, sm, xs, md, lg, bold } from './mixins';

const StyledHeader = styled.h3`
  ${normal};
  ${({ $color }) => $color && `color:${$color}`};

  &.inline {
    display: inline-block;
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
    ${lg};
  }

  &.bold {
    ${bold};
  }

  &.center {
    text-align: center;
  }

  ${media.md`
    &.md {
      ${sm};
    }
  `};
`;

export const Header = ({ children, className, color }) => {
  return (
    <StyledHeader className={`header-text ${className}`} $color={color}>
      {children}
    </StyledHeader>
  );
};
