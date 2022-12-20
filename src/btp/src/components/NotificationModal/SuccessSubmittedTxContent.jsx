import React from 'react';

import arrowIcon from 'btp/src/assets/images/blue-up-arrow.svg';
import { colors } from 'btp/src/components/Styles/Colors';
import { Link, Text } from 'btp/src/components/Typography';
import { useDispatch } from 'btp/src/hooks/useRematch';
import styled from 'styled-components/macro';

const Wrapper = styled.div`
  text-align: center;
  margin-top: 22.7px;

  a.sm {
    color: ${colors.tertiaryBase};
    margin-top: 14px;
    display: inline-block;

    > img {
      width: 12.27px;
      height: 12.27px;
      margin-left: 12px;
      vertical-align: middle;
    }
  }
`;

export const SuccessSubmittedTxContent = () => {
  const { setDisplay } = useDispatch(({ modal: { setDisplay } }) => ({
    setDisplay,
  }));
  return (
    <Wrapper>
      <Text className="md">Your transaction was submitted successfully.</Text>
      <Link
        className="sm bold"
        to="/transfer/history"
        center
        onClick={() => {
          setDisplay(false);
        }}
      >
        View on history
        <img src={arrowIcon} alt="icon" />
      </Link>
    </Wrapper>
  );
};
