import { Button as RebassButton } from 'rebass/styled-components';
import styled from 'styled-components';

export const ButtonBase = styled(RebassButton)`
  display: inline-block;
  border-radius: 10px;
  padding: 5px 35px;
  color: #ffffff;
  text-decoration: none;
  background-color: #2ca9b7;
  cursor: pointer;
  transition: background-color 0.3s ease;

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
