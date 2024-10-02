import { css } from 'styled-components';

export const notificationCSS = css`
  position: relative;

  @keyframes pulse {
    0% {
      opacity: 1;
      transform: scale(1);
    }
    100% {
      opacity: 0;
      transform: scale(1.8);
    }
  }

  &:before,
  &:after {
    content: '';
    position: absolute;
    display: inline-block;
    transition: all ease 0.2s;
    top: 7px;
  }

  &:before {
    width: 10px;
    height: 10px;
    background: ${({ theme }) => theme.colors?.primary};
    border-radius: 50%;
    right: 1px;
  }

  &:after {
    width: 10px;
    height: 10px;
    background: ${({ theme }) => theme.colors?.primary};
    border-radius: 50%;
    right: 1px;
    animation: pulse 1s ease 1s infinite;
  }
`;
