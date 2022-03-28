import React from 'react';

import styled from 'styled-components/macro';

import { colors } from '../Styles/Colors';

const StyledInput = styled.input`
  width: 100%;

  color: ${colors.grayText};
  caret-color: ${colors.tertiaryDark};
  border: 0;

  &:focus {
    outline: none;
  }

  /* remove number arrows */
  /* Chrome, Safari, Edge, Opera */
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  /* Firefox */
  &[type='number'] {
    -moz-appearance: textfield;
  }
`;

export const Input = React.forwardRef((props, ref) => {
  return <StyledInput {...props} ref={ref} />;
});

Input.displayName = 'Input';
