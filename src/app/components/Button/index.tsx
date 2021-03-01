import { Button as RebassButton } from 'rebass/styled-components';
import styled from 'styled-components';

export const Button = styled(RebassButton)`
  display: inline-block;
  border-radius: 10px;
  padding: 5px 25px;
  color: #ffffff;
  text-decoration: none;
  background-color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  transition: background-color 0.3s ease;
  user-select: none;

  &:hover {
    background-color: #087083;
    transition: background-color 0.2s ease;
  }

  &:disabled {
    background: #27264a;
    cursor: default;
    pointer-events: none;
  }
`;

export const TextButton = styled(RebassButton)`
  background: transparent;
  font-size: 14px;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.75);
  cursor: pointer !important;
  transition: color 0.3s ease;
  user-select: none;

  &:hover {
    color: rgba(255, 255, 255, 1);
    transition: color 0.2s ease;
  }

  &:disabled {
    cursor: default;
    pointer-events: none;
    color: #27264a;
  }
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
    color: #27264a;
  }
`;
