import React, { useCallback, useState } from 'react';

import styled from 'styled-components';

import Popover, { PopoverProps, PopperWithoutArrowAndBorder } from '../Popover';

const TooltipContainer = styled.div<{ wide?: boolean }>`
  width: ${props => (props.wide ? '300px' : '244px')};
  padding: 10px 0.9375rem;
  line-height: 150%;
  font-weight: 400;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.white};
`;

interface TooltipProps extends Omit<PopoverProps, 'content'> {
  text: React.ReactNode;
  wide?: boolean;
  containerStyle?: React.CSSProperties;
  noArrowAndBorder?: boolean;
}

export default function Tooltip({ text, wide, containerStyle, noArrowAndBorder, ...rest }: TooltipProps) {
  return (
    <>
      {noArrowAndBorder ? (
        <PopperWithoutArrowAndBorder
          content={<TooltipContainer style={{ width: '100%' }}>{text}</TooltipContainer>}
          {...rest}
        />
      ) : (
        <Popover
          content={
            <TooltipContainer style={containerStyle} wide={wide}>
              {text}
            </TooltipContainer>
          }
          {...rest}
        />
      )}
    </>
  );
}

export function MouseoverTooltip({ children, noArrowAndBorder, ...rest }: Omit<TooltipProps, 'show'>) {
  const [show, setShow] = useState(false);
  const open = useCallback(() => setShow(true), [setShow]);
  const close = useCallback(() => setShow(false), [setShow]);
  return (
    <Tooltip {...rest} show={show} noArrowAndBorder={noArrowAndBorder}>
      <div onMouseEnter={open} onMouseLeave={close}>
        {children}
      </div>
    </Tooltip>
  );
}
