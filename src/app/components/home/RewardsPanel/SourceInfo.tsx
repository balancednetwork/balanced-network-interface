import React from 'react';

import BigNumber from 'bignumber.js';
import styled from 'styled-components';

import { MAX_BOOST } from '../BBaln/utils';

const Wrap = styled.span`
  span {
    color: ${({ theme }) => theme.colors.text2};
  }
  strong {
    color: #fff;
  }
`;

const SourceInfo = ({ name, boost, apy }: { name: string; boost?: BigNumber; apy?: BigNumber }) => {
  if (!boost || !apy) return null;
  return (
    <Wrap>
      {`${name}:`} <strong>{`${apy.times(100).dp(2).times(boost).toFormat(2)}%`}</strong>{' '}
      {boost.isLessThan(2.5) && (
        <>
          <span>{`(potential `}</span>
          <strong>{`${apy.times(100).dp(2).times(MAX_BOOST).toFormat(2)}%`}</strong>
          <span>{`)`}</span>
        </>
      )}
    </Wrap>
  );
};

export default SourceInfo;
