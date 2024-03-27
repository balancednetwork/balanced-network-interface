import React, { FC } from 'react';

import styled, { keyframes, css } from 'styled-components';

import spinnerImg from 'assets/images/spinner-big.png';

type SpinnerProps = {
  size?: number;
  className?: string;
  centered?: boolean;
};

const Spinner: FC<SpinnerProps> = ({ size = 20, className, centered = false, ...rest }) => (
  <Container className={className} centered={centered} {...rest}>
    <Img src={spinnerImg} alt="spinner" width={size} height={size} />
  </Container>
);

export const absoluteCenteredCSS = css`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
`;

const Container = styled.div<{ centered: boolean }>`
  ${props => props.centered && absoluteCenteredCSS}
`;

const imageRotation = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(359deg);
  }
`;

const Img = styled.img`
  animation: ${imageRotation} 2s infinite linear;
`;

export default Spinner;
