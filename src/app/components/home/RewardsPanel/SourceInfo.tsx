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
      {`${name}:`}{' '}
      <strong>{`${apy
        .times(100)
        .times(boost)
        .toFormat(apy.times(100).times(boost).isGreaterThan(100) ? 0 : 2, BigNumber.ROUND_HALF_UP)}%`}</strong>{' '}
      {boost.isLessThan(2.5) && (
        <>
          <span>{`(potential: `}</span>
          <strong>{`${apy
            .times(100)
            .times(MAX_BOOST)
            .dp(2)
            .toFormat(apy.times(100).times(MAX_BOOST).isGreaterThan(100) ? 0 : 2, BigNumber.ROUND_HALF_UP)}%`}</strong>
          <span>{`)`}</span>
        </>
      )}
    </Wrap>
  );
};

export default SourceInfo;
