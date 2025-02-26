import React from 'react';
import styled, { css } from 'styled-components';

const StyledButton = styled.button<{ isActive: boolean }>`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%) scale(0);
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  color: ${({ theme }) => theme.colors.text};
  opacity: 0;
  pointer-events: none;
  transition: all 0.2s ease-in-out;

  ${({ isActive }) =>
    isActive &&
    css`
      pointer-events: auto;
      opacity: 0.6;
      transform: translateY(-50%) scale(1);
    `}

  &:hover {
    opacity: 1;
  }
`;

interface CancelSearchButtonProps {
  isActive: boolean;
  onClick: () => void;
}

const CancelSearchButton: React.FC<CancelSearchButtonProps> = ({ onClick, isActive }) => {
  return (
    <StyledButton onClick={onClick} isActive={isActive}>
      ✕
    </StyledButton>
  );
};

export default CancelSearchButton;
