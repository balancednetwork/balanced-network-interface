import React, { useCallback, useState } from 'react';

import styled from 'styled-components';

import Popover, { PopoverProps } from '../Popover';

const TooltipContainer = styled.div<{ wide?: boolean; small?: boolean }>`
  ${({ theme }) => theme.mediaWidth.smartPhone`
    ${props => props.small && ' width: 165px;  font-size: 12px; padding: 11px;'}
  `}

  width: ${props => (props.wide ? '300px' : '244px')};
  padding: 12px 1rem;
  line-height: 150%;
  font-weight: 400;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.white};
`;

interface TooltipProps extends Omit<PopoverProps, 'content'> {
  text: React.ReactNode;
  wide?: boolean;
  small?: boolean;
}

export default function Tooltip({ text, wide, small, ...rest }: TooltipProps) {
  return (
    <Popover
      content={
        <TooltipContainer wide={wide} small={small}>
          {text}
        </TooltipContainer>
      }
      {...rest}
    />
  );
}

export function MouseoverTooltip({ children, ...rest }: Omit<TooltipProps, 'show'>) {
  const [show, setShow] = useState(false);
  const open = useCallback(() => setShow(true), [setShow]);
  const close = useCallback(() => setShow(false), [setShow]);
  return (
    <Tooltip {...rest} show={show}>
      <div onMouseEnter={open} onMouseLeave={close}>
        {children}
      </div>
    </Tooltip>
  );
}
