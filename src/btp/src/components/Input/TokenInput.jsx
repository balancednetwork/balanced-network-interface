import React, { useState, useRef, useEffect } from 'react';

import { colors } from 'btp/src/components/Styles/Colors';
import { Text } from 'btp/src/components/Typography';
import { HeaderMixin } from 'btp/src/components/Typography/Header';
import { toSeparatedNumberString } from 'btp/src/utils/app';
import PropTypes from 'prop-types';
import styled from 'styled-components/macro';

import { Input } from './Input';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 auto;
  position: relative;

  .token-label {
    ${HeaderMixin.mdBold}
    background-color: ${colors.grayBG};
    word-break: break-word;
    margin: 0 32px;
    padding: 0 10px;
    display: none;
    position: absolute;
    top: 0;

    &.active {
      display: block;
    }
  }
`;

const StyledTokenInput = styled(Input)`
  ${HeaderMixin.mdBold}
  width: 105px;
  background-color: transparent;
  width: 100%;
  padding: 0 32px;
  text-align: center;
`;

export const TokenInput = ({ isCurrent, value, token, usdRate, onBlur = () => {}, meta = {}, ...props }) => {
  const [showInput, setShowInput] = useState(true);
  const tokenInputRef = useRef();

  useEffect(() => {
    if (isCurrent) {
      tokenInputRef.current.focus();
      setShowInput(true);
    }
  }, [isCurrent, setShowInput]);

  return (
    <Wrapper>
      <StyledTokenInput
        {...props}
        value={value}
        min={0}
        type="number"
        onBlur={e => {
          onBlur(e);
          setShowInput(false);
        }}
        ref={tokenInputRef}
      />

      <div
        className={`token-label ${!showInput && 'active'}`}
        onClick={() => {
          setShowInput(true);
          tokenInputRef.current.focus();
        }}
      >
        {value || 0} {token}
      </div>
      <Text className="md center">= ${toSeparatedNumberString(usdRate * value)}</Text>
      {meta.error && meta.touched && <Text className="xs err-msg">{meta.error}</Text>}
    </Wrapper>
  );
};

TokenInput.propTypes = {
  /** The screen including TokenIput comp is displayed or not */
  isCurrent: PropTypes.bool,
  /** Input value */
  value: PropTypes.string,
  /** Token symbol */
  token: PropTypes.string,
  /** Token in USD rate */
  usdRate: PropTypes.number,
  /** Hanlde onBlur manually */
  onBlur: PropTypes.func,
  /** Meta object from react-final-form */
  meta: PropTypes.object,
};
