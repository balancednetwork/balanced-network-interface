import React, { useCallback, useState } from 'react';

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

export default function QuestionHelper({ text }: { text: string }) {
  const [show, setShow] = useState<boolean>(false);

  const open = useCallback(() => setShow(true), [setShow]);
  const close = useCallback(() => setShow(false), [setShow]);

  const smallSp = useMedia('(max-width: 360px)');

  return (
    <span style={{ marginLeft: 4, verticalAlign: 'top' }}>
      <Tooltip text={text} show={show} placement="top">
        {!smallSp && (
          <QuestionWrapper onClick={open} onMouseEnter={open} onMouseLeave={close}>
            <QuestionIcon width={14} />
          </QuestionWrapper>
        )}
      </Tooltip>
    </span>
  );
}
