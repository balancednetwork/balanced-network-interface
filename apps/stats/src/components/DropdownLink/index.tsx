import React from 'react';

import { Flex } from 'rebass';
import styled from 'styled-components';

import { UnderlineText } from '@/components/DropdownText';
import { Typography } from '@/theme';

const StyledUnderlineText = styled(UnderlineText)`
  padding-right: 17px;
`;

export const ArrowDown = styled(Flex)<{ rotated?: boolean }>`
  width: 0;
  height: 0;
  position: absolute;
  right: 0;
  top: 10px;

  &::before,
  &:after {
    content: '';
    position: absolute;
    width: 2px;
    height: 10px;
    background: ${({ theme }) => theme.colors.primary};
    border-radius: 3px;
    transition: all 0.3s ease;
    top: 0;
  }

  &::before {
    left: 3px;
    transform: ${({ rotated }) => (rotated ? 'rotate(-45deg)' : 'rotate(-135deg)')};
  }

  &::after {
    left: -3px;
    transform: ${({ rotated }) => (rotated ? 'rotate(45deg)' : 'rotate(135deg)')};
  }
`;

export default function DropdownLink({
  expanded,
  setExpanded,
}: {
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
}) {
  return (
    <Typography fontSize={18} textAlign="center" paddingBottom="5px" mt="5px" color="primaryBright" pt="30px">
      {expanded ? (
        <StyledUnderlineText onClick={() => setExpanded(false)}>
          Show less
          <ArrowDown rotated />
        </StyledUnderlineText>
      ) : (
        <StyledUnderlineText onClick={() => setExpanded(true)}>
          Show all
          <ArrowDown />
        </StyledUnderlineText>
      )}
    </Typography>
  );
}
