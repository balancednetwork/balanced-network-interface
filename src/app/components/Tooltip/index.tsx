import React, { useCallback, useState } from 'react';

import { isIOS } from 'react-device-detect';
import styled from 'styled-components';

import Popover, { PopoverProps, PopperWithoutArrowAndBorder } from '../Popover';

export const TooltipContainer = styled.div<{ wide?: boolean; small?: boolean; customWidth?: number }>`
  width: ${props => (props.customWidth ? `${props.customWidth}px` : props.wide ? '300px' : '260px')};
  padding: 10px 0.9375rem;
  line-height: 150%;
  font-weight: 400;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.white};

  @media (max-width: 650px) {
    ${props => props.small && ' width: 180px; padding: 11px;'}
  }

  @media (max-width: 410px) {
    ${props => props.small && ' width: 120px; padding: 10px'}
  }
`;

export interface TooltipProps extends Omit<PopoverProps, 'content'> {
  text: React.ReactNode;
  wide?: boolean;
  small?: boolean;
  customWidth?: number;
  containerStyle?: React.CSSProperties;
  noArrowAndBorder?: boolean;
  noArrow?: boolean;
  refStyle?: React.CSSProperties;
}

export default function Tooltip({
  text,
  wide,
  small,
  customWidth,
  containerStyle,
  refStyle,
  noArrowAndBorder,
  ...rest
}: TooltipProps) {
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
            <TooltipContainer style={containerStyle} wide={wide} small={small} customWidth={customWidth}>
              {text}
            </TooltipContainer>
          }
          {...rest}
          refStyle={refStyle}
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
      <div onClick={open} {...(!isIOS ? { onMouseEnter: open } : null)} onMouseLeave={close}>
        {children}
      </div>
    </Tooltip>
  );
}
