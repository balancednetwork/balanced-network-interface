import React from 'react';

import { colors } from 'btp/src/components/Styles/Colors';
import { media } from 'btp/src/components/Styles/Media';
import styled from 'styled-components/macro';

import Button from './Button';

const { primaryBrandLight, primaryBrandBG, grayScaleLoading, graySubText } = colors;

const PrimaryButtonStyled = styled(Button)`
  :hover,
  :active,
  :focus {
    background-color: ${primaryBrandLight};
    color: ${primaryBrandBG};
  }

  :disabled {
    background-color: ${grayScaleLoading};
    color: ${graySubText};

    :hover {
      background-color: ${grayScaleLoading};
      color: ${graySubText};
    }
  }

  ${media.md`
    width: 100%;
  `};
`;

const PrimaryButton = ({ children, ...rest }) => {
  return <PrimaryButtonStyled {...rest}>{children}</PrimaryButtonStyled>;
};

export default PrimaryButton;
