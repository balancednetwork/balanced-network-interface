import React from 'react';

import leftArrow from 'btp/src/assets/images/blue-left-arrow.svg';
import { colors } from 'btp/src/components/Styles/Colors';
import { SubTitleMixin } from 'btp/src/components/Typography/SubTitle';
import styled from 'styled-components/macro';

import { Button as PrimaryButton } from 'app/components/Button';

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: 40px 32px 32px;

  .back-button {
    ${SubTitleMixin.mdBold};
    background-color: transparent;
    color: ${colors.tertiaryBase};
    border: 0;

    display: flex;
    align-items: center;

    &:before {
      content: '';
      background: no-repeat center/cover url('${leftArrow}');
      width: 8px;
      height: 14px;
      margin-right: 15.5px;
    }
  }
`;
const StyledButton = styled(PrimaryButton)`
  padding: 20px 32px;
  width: auto;
  height: auto;
`;

export const ControlButtons = ({ onBack = () => {}, onExecute = () => {}, executeLabel = 'Transfer' }) => {
  return (
    <Wrapper>
      <button className="back-button" onClick={onBack} type="button">
        Back
      </button>
      <StyledButton onClick={onExecute} type="submit">
        {executeLabel}
      </StyledButton>
    </Wrapper>
  );
};
