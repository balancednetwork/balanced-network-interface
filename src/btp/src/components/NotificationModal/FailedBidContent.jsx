import React from 'react';

import styled from 'styled-components/macro';

import { colors } from '../Styles/Colors';
import { Text } from '../Typography';

const Wrapper = styled.div`
  text-align: left;
  padding-top: 27.17px;

  .subtext {
    margin: 14px 0 9px;
  }

  .plain-text.xs {
    color: ${colors.graySubText};

    span {
      color: ${colors.grayText};
    }
  }
`;

export const FailedBidContent = ({ message }) => {
  return (
    <Wrapper>
      <Text className="md">Bid failure. Please input proper amount.</Text>
      <Text className="xs subtext">
        Minimium bid: <span>100</span> ICX
      </Text>
      <Text className="xs">
        Minimium incremental bid: <span>10%</span> higher than the current bid
      </Text>
      {message && <Text className="xs subtext">{message.toString()}</Text>}
    </Wrapper>
  );
};
