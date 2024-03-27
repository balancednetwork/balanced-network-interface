import { Link } from 'react-router-dom';
import { Button as RebassButton } from 'rebass/styled-components';
import styled, { css } from 'styled-components';

export const Button = styled(RebassButton)<{ warning?: boolean }>`
  display: inline-block;
  border-radius: 10px;
  padding: 5px 15px;
  color: #ffffff;
  text-decoration: none;
  background-color: ${({ theme }) => theme.colors.primary};
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.3s ease;
  user-select: none;
  line-height: 1.4;

  &:hover {
    background-color: #087083;
    transition: background-color 0.2s ease;
  }

  &:disabled {
    background: rgba(255, 255, 255, 0.15);
    cursor: not-allowed;
    pointer-events: none;
  }

  ${({ theme }) => theme.mediaWidth.upExtraSmall`
    padding: 7px 25px;
  `}

  ${({ warning }) =>
    warning &&
    css`
      background: #fb6a6a;
      &:hover {
        background: #a94141;
      }
    `}
`;

export const ButtonLink = styled(Link)`
  display: inline-block;
  border-radius: 10px;
  padding: 7px 25px;
  color: #ffffff;
  text-decoration: none;
  background-color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  transition: background-color 0.3s ease;
  user-select: none;
  line-height: 1.4;
  font-size: 14px;

  &:hover {
    background-color: #087083;
    transition: background-color 0.2s ease;
  }
`;

export const TextButton = styled(RebassButton)`
  background: transparent;
  font-size: 14px;
  padding: 5px 15px;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.75);
  cursor: pointer;
  transition: color 0.3s ease;
  user-select: none;
  line-height: 1.4;
  white-space: nowrap;

  &:hover {
    color: rgba(255, 255, 255, 1);
    transition: color 0.2s ease;
  }

  &:disabled {
    cursor: default;
    pointer-events: none;
    color: rgba(255, 255, 255, 0.15);
  }

  ${({ theme }) => theme.mediaWidth.upExtraSmall`
    padding: 7px 25px;
  `}
`;

export const IconButton = styled(RebassButton)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  background-color: #2395aa;
  border-radius: 100px;
  color: ${({ theme }) => theme.colors.bg1};
  cursor: pointer;
  padding: 4px;
  outline: none;

  &:hover,
  &:focus {
    background-color: #087083;
    transition: background-color 0.2s ease;
  }

  &:disabled {
    cursor: default;
    pointer-events: none;
    color: rgba(255, 255, 255, 0.15);
  }
`;

export const AlertButton = styled(RebassButton)`
  display: inline-block;
  border-radius: 10px;
  padding: 5px 15px;
  color: #ffffff;
  text-decoration: none;
  background-color: ${({ theme }) => theme.colors.alert};
  cursor: pointer;
  transition: background-color 0.3s ease;
  user-select: none;
  line-height: 1.4;

  &:hover {
    background-color: #f72c2c;
    transition: background-color 0.2s ease;
  }

  &:disabled {
    background: rgba(255, 255, 255, 0.15);
    cursor: default;
    pointer-events: none;
  }

  ${({ theme }) => theme.mediaWidth.upExtraSmall`
    padding: 7px 25px;
  `}
`;
