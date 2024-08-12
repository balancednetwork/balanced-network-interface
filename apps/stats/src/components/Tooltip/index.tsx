import React, { useCallback, useState } from 'react';

import styled from 'styled-components';

import Popover, { PopoverProps } from '../Popover';

export const TooltipContainer = styled.div<{ width?: number }>`
  width: 100%;
  max-width: ${({ width }) => (width ? `${width}px` : `240px`)};
  padding: 12px 1rem;
  line-height: 150%;
  font-weight: 400;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.white};
`;

interface TooltipProps extends Omit<PopoverProps, 'content'> {
  text: string | JSX.Element;
  width?: number;
}

export default function Tooltip({ text, width, ...rest }: TooltipProps) {
  return <Popover content={<TooltipContainer width={width}>{text}</TooltipContainer>} {...rest} />;
}

export function MouseoverTooltip({ children, width, ...rest }: Omit<TooltipProps, 'show'>) {
  const [show, setShow] = useState(false);
  const open = useCallback(() => setShow(true), [setShow]);
  const close = useCallback(() => setShow(false), [setShow]);
  return (
    <Tooltip {...rest} width={width} show={show}>
      <div onMouseEnter={open} onMouseLeave={close}>
        {children}
      </div>
    </Tooltip>
  );
}
