import React from 'react';

import { Flex, Button as RebassButton } from 'rebass/styled-components';
import styled, { keyframes } from 'styled-components';

import { Container } from 'app/components/Layout';
import { Typography } from 'app/theme/';

const imageRotation = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(359deg);
  }
`;

const Spin = styled.img`
  width: 300px;
  animation-name: ${imageRotation};
  animation-duration: 40000ms;
  animation-iteration-count: infinite;
  animation-timing-function: linear;
`;

const StyledContainer = styled(Container)`
  justify-content: center;
`;

const Button = styled(RebassButton)`
  display: inline-block;
  border-radius: 10px;
  padding: 7px 25px;
  color: #ffffff;
  text-decoration: none;
  background-color: #2ca9b7;
  cursor: pointer !important;
  transition: background-color 0.3s ease;
  line-height: 32px;
  font-weight: normal;
`;

export function MaintenancePage() {
  return (
    <StyledContainer>
      <Flex flexDirection="column" alignItems="center">
        <figure>
          <Spin src="https://balanced.network/img/feature/ring-normal.svg" alt="" />
        </figure>
        <Typography fontSize={[45, 45, 45, 60]} textAlign="center" my={2} color="white">
          Balanced is offline
        </Typography>
        <Typography fontSize={18} textAlign="center" mb={4}>
          The ICON blockchain is being upgraded, and should be back online in a few hours.
        </Typography>
        <Button as="a" href="https://balanced.network">
          Go to the website
        </Button>
      </Flex>
    </StyledContainer>
  );
}
