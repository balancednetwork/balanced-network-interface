import React, { useCallback, useEffect, useState } from 'react';

import { isIOS } from 'react-device-detect';

import Popover, { PopoverProps } from '../Popover';

export interface TooltipProps extends Omit<PopoverProps, 'content'> {
  content: React.ReactNode;
  wide?: boolean;
  small?: boolean;
  width?: number;
  containerStyle?: React.CSSProperties;
  refStyle?: React.CSSProperties;
}

export default function Tooltip({ content, wide, small, width, containerStyle, refStyle, ...rest }: TooltipProps) {
  return <Popover content={content} {...rest} refStyle={refStyle} />;
}

interface MouseoverTooltipProps extends TooltipProps {
  closeAfterDelay?: number;
}

export function MouseoverTooltip({ children, closeAfterDelay, ...rest }: Omit<MouseoverTooltipProps, 'show'>) {
  const [show, setShow] = useState(false);
  const open = useCallback(() => setShow(true), []);
  const close = useCallback(() => setShow(false), []);

  useEffect(() => {
    if (show && closeAfterDelay) {
      setTimeout(close, closeAfterDelay);
    }
  }, [show, closeAfterDelay, close]);

  return (
    <Tooltip {...rest} show={show}>
      <div onClick={open} {...(!isIOS ? { onMouseEnter: open } : null)} onMouseLeave={close}>
        {children}
      </div>
    </Tooltip>
  );
}
