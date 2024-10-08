import React, { useCallback, useState } from 'react';

import { Placement } from '@popperjs/core';
import { useMedia } from 'react-use';

import Tooltip from '@/app/components/Tooltip';
import QuestionIcon from '@/assets/icons/question.svg';

export default function QuestionHelper({
  text,
  placement = 'top',
  containerStyle,
  width,
  strategy,
  iconStyle,
  offset,
  hideOnSmall = true,
}: {
  text: React.ReactNode;
  placement?: Placement;
  containerStyle?: React.CSSProperties;
  iconStyle?: React.CSSProperties;
  width?: number;
  strategy?: 'fixed' | 'absolute';
  offset?: [number, number];
  hideOnSmall?: boolean;
}) {
  const [show, setShow] = useState<boolean>(false);

  const open = useCallback(() => setShow(true), []);
  const close = useCallback(() => setShow(false), []);

  const smallSp = useMedia('(max-width: 360px)');
  const shouldShow = hideOnSmall ? !smallSp : true;

  return (
    <Tooltip
      content={<div className="w-72 p-4 text-secondary-foreground text-body">{text}</div>}
      show={show}
      placement={placement}
      containerStyle={containerStyle}
      width={width}
      strategy={strategy}
      offset={offset}
    >
      {shouldShow && (
        <QuestionIcon
          onClick={open}
          onMouseEnter={open}
          onMouseLeave={close}
          className="cursor-help"
          style={iconStyle}
          width={14}
        />
      )}
    </Tooltip>
  );
}
