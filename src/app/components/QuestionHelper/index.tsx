import React, { useCallback, useState } from 'react';

import styled from 'styled-components';

import Tooltip from 'app/components/Tooltip';
import { ReactComponent as QuestionIcon } from 'assets/icons/question.svg';

const QuestionWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  outline: none;
  cursor: help;
  color: ${({ theme }) => theme.colors.text1};
`;

const LightQuestionWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.2rem;
  border: none;
  background: none;
  outline: none;
  cursor: default;
  border-radius: 36px;
  width: 24px;
  height: 24px;
  background-color: rgba(255, 255, 255, 0.1);
  color: ${({ theme }) => theme.colors.white};

  :hover,
  :focus {
    opacity: 0.7;
  }
`;

const QuestionMark = styled.span`
  font-size: 1rem;
`;

export default function QuestionHelper({ text }: { text: string }) {
  const [show, setShow] = useState<boolean>(false);

  const open = useCallback(() => setShow(true), [setShow]);
  const close = useCallback(() => setShow(false), [setShow]);

  return (
    <span style={{ marginLeft: 4, verticalAlign: 'middle' }}>
      <Tooltip text={text} show={show} placement="top">
        <QuestionWrapper onClick={open} onMouseEnter={open} onMouseLeave={close}>
          <QuestionIcon width={14} />
        </QuestionWrapper>
      </Tooltip>
    </span>
  );
}

export function LightQuestionHelper({ text }: { text: string }) {
  const [show, setShow] = useState<boolean>(false);

  const open = useCallback(() => setShow(true), [setShow]);
  const close = useCallback(() => setShow(false), [setShow]);

  return (
    <span style={{ marginLeft: 4 }}>
      <Tooltip text={text} show={show}>
        <LightQuestionWrapper onClick={open} onMouseEnter={open} onMouseLeave={close}>
          <QuestionMark>?</QuestionMark>
        </LightQuestionWrapper>
      </Tooltip>
    </span>
  );
}
