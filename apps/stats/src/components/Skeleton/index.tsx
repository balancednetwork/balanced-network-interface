import React from 'react';
import styled from 'styled-components';

interface SkeletonProps {
  variant?: 'text' | 'rectangular' | 'circle';
  width?: string | number;
  height?: string | number;
  mr?: string;
  ml?: string;
  mt?: string;
  mb?: string;
  className?: string;
  animation?: string;
}

const SkeletonElement = styled.div<{
  variant: 'text' | 'rectangular' | 'circle';
  width: string | number;
  height: string | number;
  mr?: string;
  ml?: string;
  mt?: string;
  mb?: string;
  className?: string;
}>`
  @keyframes colorPulse {
    0% {
      background-color: rgba(44, 169, 183, 0.2);
    }
    50% {
      background-color: rgba(44, 169, 183, 0.4);
    }
    100% {
      background-color: rgba(44, 169, 183, 0.2);
    }
  }
  background-color: rgba(44, 169, 183, 0.2);
  animation: colorPulse 1s infinite ease-in-out;
  display: block;
  border-radius: ${({ variant }) => (variant === 'circle' ? '50%' : '4px')};
  width: ${({ width }) => (typeof width === 'number' ? `${width}px` : width)};
  height: ${({ variant, width, height }) =>
    variant === 'circle'
      ? typeof width === 'number'
        ? `${width}px`
        : width
      : typeof height === 'number'
        ? `${height}px`
        : height};
        
  ${({ mr }) => mr && `margin-right: ${mr};`}
  ${({ ml }) => ml && `margin-left: ${ml};`}
  ${({ mt }) => (mt ? `margin-top: ${mt};` : 'margin-top: 5px;')}
  ${({ mb }) => (mb ? `margin-bottom: ${mb};` : 'margin-bottom: 5px;')}
`;

const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width = '100%',
  height = '16px',
  mt,
  mr,
  mb,
  ml,
  className,
}) => {
  return (
    <SkeletonElement
      width={width}
      height={height}
      variant={variant}
      mt={mt}
      mr={mr}
      mb={mb}
      ml={ml}
      className={className}
    />
  );
};

export default Skeleton;
