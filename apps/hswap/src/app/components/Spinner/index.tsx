import React, { FC } from 'react';

import styled, { keyframes, css } from 'styled-components';

import TickIcon from '@/assets/icons/tick.svg';
import spinnerImg from '@/assets/images/spinner-big.png';
import { AnimatePresence, motion } from 'framer-motion';

type SpinnerProps = {
  size?: number;
  className?: string;
  $centered?: boolean;
  success?: boolean;
};

const Spinner: FC<SpinnerProps> = ({ size = 20, className, $centered = false, success = false, ...rest }) => (
  <Container className={className} $centered={$centered} {...rest}>
    <AnimatePresence>
      {!success ? (
        <motion.div
          initial={{ opacity: 0, height: 0, y: 0 }}
          animate={{ opacity: 1, height: size, y: 0 }}
          exit={{ opacity: 0, height: 0, y: 10 }}
          key="spinner-element"
        >
          <Img src={spinnerImg} alt="spinner" width={size} height={size} />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, height: 0, scale: 1.5 }}
          animate={{ opacity: 1, height: size, scale: 1 }}
          exit={{ opacity: 0, height: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          key="success-element"
        >
          <TickIcon width={size} height={size} />
        </motion.div>
      )}
    </AnimatePresence>
  </Container>
);

export const absoluteCenteredCSS = css`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
`;

const Container = styled.div<{ $centered: boolean }>`
  ${({ $centered }) => $centered && absoluteCenteredCSS}
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
