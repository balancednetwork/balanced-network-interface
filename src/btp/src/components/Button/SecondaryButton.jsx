import React from 'react';

import { colors } from 'btp/src/components/Styles/Colors';
import styled from 'styled-components/macro';

import Button from './Button';

const { primaryBrandLight, primaryBrand } = colors;

const StyledButton = styled(Button)`
  background-color: transparent !important;
  color: ${primaryBrandLight};
  border: solid 1px ${primaryBrandLight};

  &:hover {
    background-color: transparent;
    color: ${primaryBrand};
    border: solid 1px ${primaryBrand};
  }
`;

export const SecondaryButton = ({ children, ...rest }) => {
  return <StyledButton {...rest}>{children}</StyledButton>;
};

export default SecondaryButton;
