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
}

const SkeletonElement = styled.div<{
  variant: 'text' | 'rectangular' | 'circle';
  width: string | number;
  height: string | number;
  mr: string;
  ml: string;
  mt: string;
  mb: string;
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
  margin-right: ${({ mr }) => mr};
  margin-left: ${({ ml }) => ml};
  margin-top: ${({ mt }) => mt};
  margin-bottom: ${({ mb }) => mb};
`;

const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width = '100%',
  height = '1em',
  mt = '0',
  mr = '0',
  mb = '0',
  ml = '0',
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
