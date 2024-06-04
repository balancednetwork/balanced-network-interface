import styled, { css } from 'styled-components';
import { Button } from 'app/components/Button';

export const StyledButton = styled(Button)<{ $loading?: boolean }>`
  position: relative;

  &:after,
  &:before {
    content: '';
    position: absolute;
    width: 0;
    height: 2px;
    left: 0;
    border-radius: 5px;
    background: ${({ theme }) => theme.colors.primaryBright};
  }

  &:after {
    bottom: 0;
  }

  &:before {
    top: 0;
  }

  @keyframes expand {
    0% {
      width: 0;
      left: 50%;
      opacity: 0;
    }
    50% {
      width: 28%;
      left: 36%;
      opacity: 1;
    }
    100% {
      width: 100%;
      left: 0%;
      opacity: 0;
    }
  }

  ${({ $loading }) =>
    $loading &&
    css`
    &:after {
      animation: expand 2s infinite;
    }
    `}

`;
