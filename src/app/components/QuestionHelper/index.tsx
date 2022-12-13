import React, { useCallback, useState } from 'react';

import { Placement } from '@popperjs/core';
import { useMedia } from 'react-use';
import styled from 'styled-components';

import Tooltip from 'app/components/Tooltip';
import { ReactComponent as QuestionIcon } from 'assets/icons/question.svg';

export const QuestionWrapper = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  outline: none;
  cursor: help;
  color: ${({ theme }) => theme.colors.text1};
`;

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

  const open = useCallback(() => setShow(true), [setShow]);
  const close = useCallback(() => setShow(false), [setShow]);

  const smallSp = useMedia('(max-width: 360px)');
  const shouldShow = hideOnSmall ? !smallSp : true;

  return (
    <span style={{ marginLeft: 4, verticalAlign: 'top' }}>
      <Tooltip
        text={text}
        show={show}
        placement={placement}
        containerStyle={containerStyle}
        width={width}
        strategy={strategy}
        offset={offset}
      >
        {shouldShow && (
          <QuestionWrapper onClick={open} onMouseEnter={open} onMouseLeave={close} style={iconStyle}>
            <QuestionIcon width={14} />
          </QuestionWrapper>
        )}
      </Tooltip>
    </span>
  );
}
