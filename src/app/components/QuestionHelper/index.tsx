import React, { useCallback, useState } from 'react';

import styled from 'styled-components';

import Tooltip from 'app/components/Tooltip';
import { ReactComponent as QuestionIcon } from 'assets/icons/question.svg';

export const QuestionWrapper = styled.div<{ hideOnExtraSp?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  outline: none;
  cursor: help;
  color: ${({ theme }) => theme.colors.text1};
  ${({ theme }) => theme.mediaWidth.small`
    ${props => props.hideOnExtraSp && 'display: none;'}
  `}
`;

export default function QuestionHelper({ text }: { text: string }, hideOnExtraSp?: boolean) {
  const [show, setShow] = useState<boolean>(false);

  const open = useCallback(() => setShow(true), [setShow]);
  const close = useCallback(() => setShow(false), [setShow]);

  return (
    <span style={{ marginLeft: 4, verticalAlign: 'top' }}>
      <Tooltip text={text} show={show} placement="top">
        <QuestionWrapper onClick={open} onMouseEnter={open} onMouseLeave={close} hideOnExtraSp={hideOnExtraSp}>
          <QuestionIcon width={14} />
        </QuestionWrapper>
      </Tooltip>
    </span>
  );
}
