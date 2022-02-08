import React, { FC } from 'react';

import styled, { keyframes, css } from 'styled-components';

import spinnerImgBig from 'assets/images/spinner-big.png';
import spinnerImg from 'assets/images/spinner.png';

type ImageSize = 'lg' | 'sm';

type SpinnerProps = {
  size?: ImageSize;
  className?: string;
  centered?: boolean;
};

const Spinner: FC<SpinnerProps> = ({ size = 'sm', className, centered = false, ...rest }) => (
  <Container className={className} centered={centered} {...rest}>
    {size === 'sm' ? (
      <Img src={spinnerImg} alt="spinner" width="20" height="20" />
    ) : (
      <Img src={spinnerImgBig} alt="spinner" width="75" height="75" />
    )}
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
