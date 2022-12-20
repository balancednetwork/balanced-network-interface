import React from 'react';

import { SubTitleMixin } from 'btp/src/components/Typography/SubTitle';
import { TextMixin } from 'btp/src/components/Typography/Text';
import { Link as RouterLink } from 'react-router-dom';
import styled from 'styled-components/macro';

import { colors } from '../Styles/Colors';

const Wrapper = styled.p`
  > a {
    color: ${colors.tertiaryBase};
  }

  > a.md {
    ${SubTitleMixin.md};
  }

  > a.xs {
    ${TextMixin.xsBold};
  }

  > a.sm {
    font-size: 14px;
    line-height: 20px;
  }

  > a.bold {
    ${TextMixin.bold};
  }

  ${({ block, center }) => `
    ${!block ? 'display: inline-block;' : ''}
    ${center ? 'text-align: center;' : ''}
  `}
`;

export const Link = ({ children, to, className, block = true, center, ...props }) => {
  return (
    <Wrapper block={block} center={center}>
      <RouterLink to={to} {...props} className={className}>
        {children}
      </RouterLink>
    </Wrapper>
  );
};
